import { Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Consumer from './pages/Consumer';
import ProfileSetup from './pages/ProfileSetup'; // <-- IDINAGDAG ITO
import { LanguageProvider } from './context/LanguageContext';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <LanguageProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* BAGONG ROUTE PARA SA PROFILE SETUP */}
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          <Route path="/home/*" element={<Consumer />} />
          <Route path="/my-reports/*" element={<Consumer />} />
          <Route path="/settings/*" element={<Consumer />} />
          <Route path="/outage-history/*" element={<Consumer />} />
          
          <Route path="/admin/*" element={<Admin />} />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </LanguageProvider>
  </IonApp>
);

export default App; 