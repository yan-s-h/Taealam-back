import express from 'express'
import * as auth from '../middlewares/auth.js'
import { create, getAll, edit, get, getId } from '../controllers/courses.js'
import admin from '../middlewares/admin.js'

const router = express.Router()

router.post('/', auth.jwt, create)
router.get('/all', auth.jwt, admin, getAll)
router.get('/', get)
router.get('/:id', getId)
router.patch('/:id', auth.jwt, admin, edit)

export default router
