import { useEffect, useState } from 'react';
import { Route, Navigate, useNavigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { getRedirectResult } from 'firebase/auth'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 

import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Consumer from './pages/Consumer';
import { LanguageProvider } from './context/LanguageContext';

setupIonicReact();

// GATEKEEPER COMPONENT
const AppGatekeeper = ({ children }: { children: React.ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          
          if (!user.email || !user.email.endsWith('@gmail.com')) {
            await auth.signOut();
            alert('Mali: Kailangan gumamit ng @gmail.com account.');
            navigate('/login', { replace: true });
          } else {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'Google User',
                role: 'consumer',
                branch: 'Naujan',
                address: 'Hindi pa nailalagay',
              });
              navigate('/home', { replace: true });
            } else {
              const userData = userDoc.data();
              if (userData.role === 'admin') navigate('/admin', { replace: true });
              else navigate('/home', { replace: true });
            }
          }
        }
      } catch (err) {
        console.error("Redirect error:", err);
      } finally {
        setChecking(false);
      }
    };
    checkAuthRedirect();
  }, [navigate]);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0B192C' }}>
        <IonSpinner name="crescent" style={{ color: '#FFC107', width: '50px', height: '50px' }} />
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => (
  <IonApp>
    <LanguageProvider>
      <IonReactRouter>
        <AppGatekeeper>
          <IonRouterOutlet>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/home/*" element={<Consumer />} />
            <Route path="/my-reports/*" element={<Consumer />} />
            <Route path="/settings/*" element={<Consumer />} />
            <Route path="/outage-history/*" element={<Consumer />} />
            
            <Route path="/admin/*" element={<Admin />} />
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </IonRouterOutlet>
        </AppGatekeeper>
      </IonReactRouter>
    </LanguageProvider>
  </IonApp>
);

export default App;