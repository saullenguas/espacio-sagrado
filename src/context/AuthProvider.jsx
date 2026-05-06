import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { AuthContext } from "./AuthContext";
import { authAdapter } from "../infrastructure/firebase/authAdapter";
import { createUserModel, USER_ROLES, ACCESS_TYPES } from "../domain/userModel";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const loadUserFromFirestore = async (authUser) => {
    // El rol viene ÚNICAMENTE del custom claim en el token JWT.
    // Cloud Functions es la única que puede asignar claims — nunca el cliente.
    const isAdmin = authUser.role === USER_ROLES.ADMIN;

    const userRef = doc(db, "users", authUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const firestoreData = userSnap.data();
      // Si el token dice admin pero Firestore aún no lo tiene actualizado, sincronizar
      if (isAdmin && firestoreData.role !== USER_ROLES.ADMIN) {
        await setDoc(userRef, { role: USER_ROLES.ADMIN, accessType: ACCESS_TYPES.ALL }, { merge: true });
        return { ...authUser, ...firestoreData, role: USER_ROLES.ADMIN, accessType: ACCESS_TYPES.ALL };
      }
      return { ...authUser, ...firestoreData };
    }

    // Usuario nuevo — crear documento base
    const newUser = {
      email: authUser.email,
      role: USER_ROLES.STUDENT,
      enrolledCourses: [],
      accessType: ACCESS_TYPES.LIMITED,
      premiumExpiry: null,
      createdAt: new Date(),
    };
    await setDoc(userRef, newUser);
    return { ...authUser, ...newUser };
  };

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChanged(async (authUser) => {
      setAuthError(null);
      try {
        if (!authUser) {
          setUser(null);
          return;
        }
        const domainUser = await loadUserFromFirestore(authUser);
        setUser(domainUser);
      } catch (error) {
        console.error("AuthProvider error:", error);
        setUser(null);
        setAuthError("Error al cargar tu sesión. Verifica tu conexión e intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!user?.uid) return;
    try {
      // Forzar recarga del token para obtener claims actualizados
      await authAdapter.refreshToken();
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser(prev => ({ ...prev, ...userSnap.data() }));
      }
    } catch (error) {
      console.error("Error al refrescar usuario:", error);
    }
  };

  const value = {
    user,
    loading,
    authError,
    refreshUser,
    login: authAdapter.login,
    register: authAdapter.register,
    logout: authAdapter.logout,
    resetPassword: authAdapter.resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}