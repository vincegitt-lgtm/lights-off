import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { homeOutline, documentTextOutline, personCircleOutline } from 'ionicons/icons';
import { Route, Navigate } from 'react-router-dom';
import Home from './Home';
import MyReports from './MyReports';
import ConsumerSettings from './ConsumerSettings';
import OutageHistory from './OutageHistory';

const Consumer: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/home" element={<Home />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/settings" element={<ConsumerSettings />} />
        <Route path="/outage-history" element={<OutageHistory />} />
        <Route path="/consumer" element={<Navigate to="/home" replace />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Announcements</IonLabel>
        </IonTabButton>
        <IonTabButton tab="my-reports" href="/my-reports">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>My Reports</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/settings">
          <IonIcon icon={personCircleOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default Consumer;