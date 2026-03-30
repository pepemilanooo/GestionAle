import { Router } from 'express';
import { getInterventions, getInterventionById, createIntervention, completeIntervention, startIntervention, deleteIntervention } from '../controllers/interventionController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', getInterventions);
router.get('/:id', getInterventionById);
router.post('/', createIntervention);
router.post('/:id/start', startIntervention);
router.post('/:id/complete', completeIntervention);
router.delete('/:id', deleteIntervention);
export default router;