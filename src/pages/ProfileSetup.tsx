import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonText, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { locationOutline } from 'ionicons/icons';
import logo from '../assets/logo.png';

const ProfileSetup: React.FC = () => {
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('Naujan');
  const [error, setError] = useState('');
  const [googleData, setGoogleData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('googleUser');
    if (!saved) {
      navigate('/login');
      return;
    }
    setGoogleData(JSON.parse(saved));
  }, [navigate]);

  const handleSave = async () => {
    setError('');
    if (!address) {
      setError('Kailangan mong ilagay ang iyong Address.');
      return;
    }

    if (!googleData) return;

    try {
      await setDoc(doc(db, 'users', googleData.uid), {
        uid: googleData.uid,
        email: googleData.email,
        name: googleData.name,
        role: 'consumer',
        branch: branch,
        address: address,
      });

      localStorage.removeItem('googleUser');
      
      const user = auth.currentUser;
      if (user) {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!googleData) return null;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Kumpletuhin ang Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px' }}>
          <img src={logo} alt="Logo" style={{ width: '100px', height: '100px', marginBottom: '15px' }} />
          <h2 style={{ fontWeight: 'bold', margin: '0' }}>Maligayang Pagdating, {googleData.name.split(' ')[0]}!</h2>
          <p style={{ color: 'gray', fontSize: '0.9em' }}>Kailangan lang namin ng konting detalye para makapagsimula ka.</p>
        </div>

        <IonCard style={{ borderRadius: '16px' }}>
          <IonCardContent>
            <IonItem lines="none" style={{ marginBottom: '15px' }}>
              <IonLabel position="stacked">Email (Mula sa Google)</IonLabel>
              <IonInput value={googleData.email} readonly style={{ color: 'gray' }} />
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '15px' }}>
              <IonLabel position="stacked">Kumpletong Address</IonLabel>
              <IonInput 
                value={address} 
                onIonChange={e => setAddress(e.detail.value!)} 
                placeholder="Hal: Brgy. Poblacion, Naujan, Oriental Mindoro"
              >
                <IonIcon slot="start" icon={locationOutline} color="primary" />
              </IonInput>
            </IonItem>

            <IonItem lines="none" style={{ marginBottom: '20px' }}>
              <IonLabel position="stacked">Piliin ang Branch</IonLabel>
              <IonSelect value={branch} onIonChange={e => setBranch(e.detail.value)}>
                <IonSelectOption value="Naujan">Naujan</IonSelectOption>
                <IonSelectOption value="Socorro">Socorro</IonSelectOption>
                <IonSelectOption value="Calapan City">Calapan City</IonSelectOption>
              </IonSelect>
            </IonItem>

            {error && <IonText color="danger"><p style={{ fontSize: '0.9em' }}>{error}</p></IonText>}

            <IonButton 
              expand="block" 
              onClick={handleSave} 
              style={{ '--background': 'var(--app-yellow)', '--color': '#000000', height: '50px', '--border-radius': '12px', fontWeight: 'bold' }}
            >
              I-SAVE AT MAGPATULOY
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ProfileSetup;