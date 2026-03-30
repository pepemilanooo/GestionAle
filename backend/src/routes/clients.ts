import { Router } from 'express';
import { getClients, getClientById, createClient, getProducts } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getClients);
router.get('/products', getProducts);
router.get('/:id', getClientById);
router.post('/', createClient);
export default router;