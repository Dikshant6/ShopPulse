import express from 'express'
import { authenticate } from '../middleware/auth.middleware.js';
import { getDashboard } from '../controllers/dashboard.controller.js';


export const router = express.Router();

router.get('/', authenticate, getDashboard);

export default router;