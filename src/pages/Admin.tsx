import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { homeOutline, megaphoneOutline, documentTextOutline, alertCircleOutline, personCircleOutline } from 'ionicons/icons';
import { Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

import AdminDashboard from './AdminDashboard';
import ManageAnnouncements from './ManageAnnouncements';
import ManageReports from './ManageReports';
import ActionRequired from './ActionRequired';
import AdminSettings from './AdminSettings';

const Admin: React.FC = () => {
  const [adminBranch, setAdminBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminBranch = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setAdminBranch(userDoc.data().branch);
        }
      }
      setLoading(false);
    };
    fetchAdminBranch();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  if (!adminBranch) return <div style={{ padding: '20px' }}>Walang branch na naka-assign sa account mo.</div>;

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/admin/dashboard" element={<AdminDashboard adminBranch={adminBranch} />} />
        <Route path="/admin/announcements" element={<ManageAnnouncements adminBranch={adminBranch} />} />
        <Route path="/admin/reports" element={<ManageReports adminBranch={adminBranch} />} />
        <Route path="/admin/action" element={<ActionRequired adminBranch={adminBranch} />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/admin/dashboard">
          <IonIcon icon={homeOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="announcements" href="/admin/announcements">
          <IonIcon icon={megaphoneOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Post</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/admin/reports">
          <IonIcon icon={documentTextOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Reports</IonLabel>
        </IonTabButton>
        <IonTabButton tab="action" href="/admin/action">
          <IonIcon icon={alertCircleOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Action</IonLabel>
        </IonTabButton>
        {/* PINALITAN ANG ICON MULA settingsOutline PAPUNTANG personCircleOutline */}
        <IonTabButton tab="settings" href="/admin/settings">
          <IonIcon icon={personCircleOutline} />
          <IonLabel style={{ fontSize: '0.7em' }}>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default Admin;