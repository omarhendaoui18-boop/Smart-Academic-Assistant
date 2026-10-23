import express from 'express';
import { addEtudiant, getEtudiants, getAdminStats, getStatsByFiliere, addEnseignant, getEnseignants, getAllUsers } from '../controllers/adminController.js';
const router = express.Router();

router.get('/stats', getAdminStats);
router.get('/stats/filieres', getStatsByFiliere);
router.post('/etudiants', addEtudiant);
router.get('/etudiants', getEtudiants);
router.get('/users', getAllUsers);

export default router;