import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { AuthContext } from "./AuthContext";
import { authAdapter } from "../infrastructure/firebase/authAdapter";
import { createUserModel, USER_ROLES } from "../domain/userModel";
import { ADMIN_EMAILS } from "../config/adminConfig";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromFirestore = async (authUser) => {
    const isAdminByEmail = ADMIN_EMAILS.includes(authUser.email);
    const isAdminByToken = authUser.role === USER_ROLES.ADMIN;
    const isAdmin = isAdminByEmail || isAdminByToken;

    let domainUser = isAdmin
      ? createUserModel({ ...authUser, role: USER_ROLES.ADMIN, accessType: "all" })
      : createUserModel({ ...authUser })

    const userRef = doc(db, "users", domainUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      domainUser = { ...domainUser, ...userSnap.data() };
      if (isAdmin && userSnap.data().role !== 'admin') {
        await setDoc(userRef, { role: 'admin', accessType: 'all' }, { merge: true });
        domainUser = { ...domainUser, role: 'admin', accessType: 'all' };
      }
    } else {
      const newUser = {
        email: domainUser.email,
        role: isAdmin ? "admin" : "student",
        enrolledCourses: [],
        accessType: isAdmin ? "all" : "limited",
        premiumExpiry: null,
      };
      await setDoc(userRef, newUser);
      domainUser = { ...domainUser, ...newUser };
    }

    return domainUser;
  };

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChanged(async (authUser) => {
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
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!user?.uid) return;
    try {
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
