import bcrypt from 'bcryptjs';
import { pool } from '../database/connection.js';

// 1. AJOUTER UN ÉTUDIANT
export const addEtudiant = async (req, res) => {
    try {
        const { nom, prenom, matricule, filiere, niveau } = req.body;
        const email = `${matricule}@univ.dz`;
        const defaultPassword = 'etudiant123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'etudiant']);
        const userId = userResult.insertId;

        await pool.query('INSERT INTO etudiants (user_id, nom, prenom, matricule, filiere, niveau) VALUES (?, ?, ?, ?, ?, ?)', [userId, nom, prenom, matricule, filiere, niveau]);
        res.status(201).json({ success: true, message: 'Étudiant ajouté avec succès !' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Ce matricule existe déjà !' });
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout" });
    }
};

// 2. RÉCUPÉRER TOUS LES ÉTUDIANTS
export const getEtudiants = async (req, res) => {
    try {
        const [etudiants] = await pool.query('SELECT * FROM etudiants ORDER BY id DESC');
        res.json({ success: true, data: etudiants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 3. STATISTIQUES GLOBALES
export const getAdminStats = async (req, res) => {
    try {
        const [totalRes] = await pool.query('SELECT COUNT(*) as total FROM etudiants');
        const totalEtudiants = totalRes[0].total;
        const [notes] = await pool.query('SELECT n.etudiant_id, n.valeur, m.coefficient FROM notes n JOIN matieres m ON n.matiere_id = m.id');
        
        let etudiantsMap = {};
        notes.forEach(note => {
            if (!etudiantsMap[note.etudiant_id]) etudiantsMap[note.etudiant_id] = { totalPoints: 0, totalCoeff: 0 };
            etudiantsMap[note.etudiant_id].totalPoints += (Number(note.valeur) || 0) * (Number(note.coefficient) || 0);
            etudiantsMap[note.etudiant_id].totalCoeff += Number(note.coefficient) || 0;
        });

        let danger = 0, bon = 0, sommeMoyennes = 0, nbEvalues = 0;
        for (let id in etudiantsMap) {
            if (etudiantsMap[id].totalCoeff > 0) {
                let moy = etudiantsMap[id].totalPoints / etudiantsMap[id].totalCoeff;
                sommeMoyennes += moy; nbEvalues++;
                if (moy < 8) danger++; else if (moy >= 12) bon++;
            }
        }
        const moyenneGenerale = nbEvalues > 0 ? (sommeMoyennes / nbEvalues).toFixed(2) : "0.00";
        const moyen = Math.max(0, totalEtudiants - danger - bon);
        res.json({ success: true, data: { totalEtudiants, enDanger: danger, statutMoyen: moyen, statutBon: bon, moyenneGenerale } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur de calcul' });
    }
};

// 4. MOYENNES PAR FILIÈRE
export const getStatsByFiliere = async (req, res) => {
    try {
        const [etudiants] = await pool.query('SELECT * FROM etudiants');
        const [notes] = await pool.query('SELECT n.etudiant_id, n.valeur, m.coefficient FROM notes n JOIN matieres m ON n.matiere_id = m.id');
        let filieresMap = {};
        etudiants.forEach(etu => {
            const filiere = etu.filiere || 'Non définie';
            if (!filieresMap[filiere]) filieresMap[filiere] = { totalPoints: 0, totalCoeff: 0 };
            let etuPoints = 0, etuCoeff = 0;
            notes.filter(n => n.etudiant_id === etu.id).forEach(note => {
                etuPoints += (Number(note.valeur) || 0) * (Number(note.coefficient) || 0);
                etuCoeff += Number(note.coefficient) || 0;
            });
            if (etuCoeff > 0) { filieresMap[filiere].totalPoints += etuPoints; filieresMap[filiere].totalCoeff += etuCoeff; }
        });
        let result = {};
        for (let fil in filieresMap) {
            let coeff = filieresMap[fil].totalCoeff;
            result[fil] = coeff > 0 ? parseFloat((filieresMap[fil].totalPoints / coeff).toFixed(2)) : 0;
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 5. AJOUTER UN ENSEIGNANT
export const addEnseignant = async (req, res) => {
    try {
        const { nom, prenom, email, grade, specialite } = req.body;
        const defaultPassword = 'enseignant123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'enseignant']);
        const userId = userResult.insertId;

        await pool.query('INSERT INTO enseignants (user_id, nom, prenom, grade, specialite) VALUES (?, ?, ?, ?, ?)', [userId, nom, prenom, grade, specialite]);
        res.status(201).json({ success: true, message: 'Enseignant ajouté avec succès !' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Cet email existe déjà !' });
        res.status(500).json({ success: false, message: "Erreur lors de l'ajout" });
    }
};

// 6. RÉCUPÉRER LES ENSEIGNANTS
export const getEnseignants = async (req, res) => {
    try {
        const [enseignants] = await pool.query('SELECT e.*, u.email FROM enseignants e JOIN users u ON e.user_id = u.id ORDER BY e.id DESC');
        res.json({ success: true, data: enseignants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// 7. RÉCUPÉRER TOUS LES UTILISATEURS
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, email, role, actif FROM users ORDER BY id DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};