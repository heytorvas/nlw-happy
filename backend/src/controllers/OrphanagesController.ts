import { Request, Response } from 'express'
import { getRepository } from 'typeorm';
import * as yup from 'yup'

import orphanageView from '../views/orphanages_view'
import Orphanage from '../models/Orphanages'

export default {
    async index(request: Request, response: Response) {
        const orfanagesRepository = getRepository(Orphanage)

        const orphanages = await orfanagesRepository.find({
            relations: ['images']
        })

        return response.json(orphanageView.renderMany(orphanages))
    },

    async show(request: Request, response: Response) {
        const { id } = request.params
        const orfanagesRepository = getRepository(Orphanage)

        const orphanage = await orfanagesRepository.findOneOrFail(id, {
            relations: ['images']
        })

        return response.json(orphanageView.render(orphanage))
    },

    async create(request: Request, response: Response) {
        const {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends
        } = request.body

        const requestImages = request.files as Express.Multer.File[]
        const images = requestImages.map(image => {
            return { path: image.filename }
        })
        const data = {
            name,
            latitude,
            longitude,
            about,
            instructions,
            opening_hours,
            open_on_weekends: open_on_weekends == 'true',
            images
        }
        const schema = yup.object().shape({
            name: yup.string().required(),
            latitude: yup.number().required(),
            longitude: yup.number().required(),
            about: yup.string().required().max(300),
            instructions: yup.string().required(),
            opening_hours: yup.string().required(),
            open_on_weekends: yup.boolean().required(),
            images: yup.array(yup.object().shape({
                path: yup.string().required()
            }))
        })

        await schema.validate(data, {
            abortEarly: false
        })

        const orfanagesRepository = getRepository(Orphanage)
        const orphanage = orfanagesRepository.create(data)
    
        await orfanagesRepository.save(orphanage)
    
        return response.status(201).json(orphanage)
    }
}