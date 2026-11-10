import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonAvatar, IonCardHeader, IonCardTitle, IonCardSubtitle, IonSelect, IonSelectOption, IonModal, IonAlert, IonText } from '@ionic/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut, updatePassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { logOutOutline, personCircleOutline, businessOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const ConsumerProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [barangay, setBarangay] = useState('');
  const [address, setAddress] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setName(data.name || '');
          setMobile(data.mobileNumber || '');
          setBarangay(data.barangay || '');
          setAddress(data.address || '');
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name, mobileNumber: mobile, barangay, address
      });
      alert('Na-save ang profile!');
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !newPassword) return;
    try {
      await updatePassword(user, newPassword);
      alert('Na-update ang password!');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error: any) {
      alert("Error: " + error.message);
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
          <IonTitle style={{ fontWeight: 'bold' }}>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: 'var(--ion-background-color)', minHeight: '100vh' }}>
          
          <IonCard style={{ textAlign: 'center', marginBottom: '20px', borderRadius: '16px' }}>
            <IonCardHeader style={{ paddingBottom: '0' }}>
              <IonAvatar style={{ width: '80px', height: '80px', margin: '0 auto' }}>
                <IonIcon icon={personCircleOutline} style={{ fontSize: '80px', color: 'var(--ion-color-medium)' }} />
              </IonAvatar>
              <IonCardTitle style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '1.5em' }}>
                {profile?.name || 'Consumer'}
              </IonCardTitle>
              <IonCardSubtitle>{profile?.email}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem lines="none" style={{ '--background': 'transparent' }}>
                <IonIcon slot="start" icon={businessOutline} color="primary" />
                <IonLabel color="medium">Branch</IonLabel>
                <IonText slot="end" color="primary" style={{ fontWeight: 'bold' }}>
                  {profile?.branch}
                </IonText>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--ion-text-color)' }}>Account Details</h2>

          <IonCard style={{ marginBottom: '20px', borderRadius: '12px' }}>
            <IonCardContent>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Full name</IonLabel>
                <IonInput value={name} onIonChange={e => setName(e.detail.value!)} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Mobile number</IonLabel>
                <IonInput value={mobile} onIonChange={e => setMobile(e.detail.value!)} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel position="stacked">Barangay</IonLabel>
                <IonInput value={barangay} onIonChange={e => setBarangay(e.detail.value!)} />
              </IonItem>
              <IonItem lines="none" style={{ marginBottom: '20px' }}>
                <IonLabel position="stacked">Address</IonLabel>
                <IonInput value={address} onIonChange={e => setAddress(e.detail.value!)} />
              </IonItem>
              
              <IonButton expand="block" onClick={handleSave} style={{ '--background': '#FFD600', '--color': '#000', '--border-radius': '8px', height: '50px', fontWeight: 'bold' }}>
                Save changes
              </IonButton>
            </IonCardContent>
          </IonCard>

          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--ion-text-color)' }}>Security</h2>

          <IonCard style={{ marginBottom: '20px', borderRadius: '12px' }}>
            <IonCardContent>
              <IonButton expand="block" fill="outline" color="dark" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </IonButton>
            </IonCardContent>
          </IonCard>

          <IonButton expand="block" color="danger" onClick={handleLogout} style={{ '--border-radius': '12px', height: '50px', fontWeight: 'bold' }}>
            <IonIcon slot="start" icon={logOutOutline} /> Log out
          </IonButton>
        </div>

        {/* CHANGE PASSWORD MODAL */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Change Password</IonTitle>
              <IonButton slot="end" fill="clear" color="light" onClick={() => setShowPasswordModal(false)}>Close</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">New Password</IonLabel>
              <IonInput type="password" value={newPassword} onIonChange={e => setNewPassword(e.detail.value!)} />
            </IonItem>
            <IonButton expand="block" onClick={handleChangePassword} style={{ marginTop: '20px' }}>
              Update Password
            </IonButton>
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default ConsumerProfile;