import { Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import Consumer from './pages/Consumer';
import ProfileSetup from './pages/ProfileSetup';
import Landing from './pages/Landing'; // <-- IDINAGDAG
import { LanguageProvider } from './context/LanguageContext';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <LanguageProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/landing" element={<Landing />} /> {/* <-- IDINAGDAG */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          
          <Route path="/home/*" element={<Consumer />} />
          <Route path="/my-reports/*" element={<Consumer />} />
          <Route path="/settings/*" element={<Consumer />} />
          <Route path="/profile/*" element={<Consumer />} />
          
          <Route path="/admin/*" element={<Admin />} />
          
          {/* Default route: Landing Page */}
          <Route path="/" element={<Navigate to="/landing" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </LanguageProvider>
  </IonApp>
);

export default App;