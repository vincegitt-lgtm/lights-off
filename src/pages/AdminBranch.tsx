import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { logOutOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const AdminBranch: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');
  const [officer, setOfficer] = useState('');
  const [hotline, setHotline] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setBranchName(data.branch || 'Naujan');
          setOfficer(data.name || 'Admin');
          setHotline(data.hotline || '');
          setEmail(data.email || '');
          setAddress(data.address || '');
        }
      }
      setLoading(false);
    };
    fetchBranchData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        hotline, address
      });
      alert('Na-save ang branch info!');
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Branch</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111', margin: '0 0 20px 0' }}>Branch information</h1>

          <IonCard style={{ margin: '0 0 15px 0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <IonCardContent>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Branch name</IonLabel>
                <IonInput value={branchName} readonly style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0 10px' }} />
              </IonItem>

              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Officer in charge</IonLabel>
                <IonInput value={officer} onIonChange={e => setOfficer(e.detail.value!)} style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0 10px' }} />
              </IonItem>

              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Hotline</IonLabel>
                <IonInput value={hotline} onIonChange={e => setHotline(e.detail.value!)} style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0 10px' }} />
              </IonItem>

              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput value={email} readonly style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0 10px' }} />
              </IonItem>

              <IonItem lines="none" style={{ marginBottom: '20px' }}>
                <IonLabel position="stacked">Address</IonLabel>
                <IonInput value={address} onIonChange={e => setAddress(e.detail.value!)} style={{ backgroundColor: '#f0f0f0', borderRadius: '8px', padding: '0 10px' }} />
              </IonItem>

              <IonButton expand="block" onClick={handleSave} style={{ '--background': '#FFC107', '--color': '#000', '--border-radius': '8px', height: '50px', fontWeight: 'bold' }}>
                Save changes
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonButton expand="block" color="danger" onClick={handleLogout} style={{ '--border-radius': '12px', height: '50px', fontWeight: 'bold', marginTop: '30px' }}>
            <IonIcon slot="start" icon={logOutOutline} /> Log out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminBranch;