import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { TOURNAMENT_DOC_ID, TOURNAMENT_COLLECTION } from '../utils/dataHelpers';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdminLoggedIn') === 'true');
    const [isRegFillMode, setIsRegFillMode] = useState(false);

    useEffect(() => {
        // 1. Auth State listener
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userEmail', currentUser.email);
            } else {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
            }
        });

        // 2. Registrations Fill Mode listener (PERSISTENT Live from Firebase)
        const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);

        const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isRegFillMode !== undefined) {
                    console.log("Firebase Global Sync - Fill Mode:", data.isRegFillMode);
                    setIsRegFillMode(!!data.isRegFillMode);
                }
            }
        }, (err) => {
            console.error("Fill Mode Sync Error:", err);
        });

        // 3. Admin Status sync across tabs
        const handleStorageChange = (e) => {
            if (e.key === 'isAdminLoggedIn') {
                setIsAdmin(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            unsubscribeAuth();
            unsubscribeDoc();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // Removed user dependency to keep listener always active

    const toggleRegFillMode = async () => {
        try {
            // We use the latest value from Firebase (via local state)
            const newValue = !isRegFillMode;
            const docRef = doc(db, TOURNAMENT_COLLECTION, TOURNAMENT_DOC_ID);

            // Sync with Firebase
            await updateDoc(docRef, { isRegFillMode: newValue });

            // Locally update for immediate feedback (though onSnapshot will handle it too)
            setIsRegFillMode(newValue);

            return newValue;
        } catch (error) {
            console.error("Error updating Fill Mode:", error);
            throw error;
        }
    };

    const loginAdmin = (email) => {
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminEmail', email);
        setIsAdmin(true);
    };

    const logoutAdmin = () => {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminEmail');
        setIsAdmin(false);
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
            logoutAdmin();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        isAdmin,
        isRegFillMode,
        toggleRegFillMode,
        loginAdmin,
        logoutAdmin,
        logout,
        isLoggedIn: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
