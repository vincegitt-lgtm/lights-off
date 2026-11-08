import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonText, IonSpinner, IonAvatar, IonCard, IonCardHeader, IonCardContent, IonCardSubtitle, IonCardTitle, IonToggle, IonSelect, IonSelectOption } from '@ionic/react';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { logOutOutline, personCircleOutline, businessOutline, moonOutline, sunnyOutline, globeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminSettings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    }

    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const toggleTheme = (e: any) => {
    const checked = e.detail.checked;
    setIsDarkMode(checked);
    if (checked) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
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
          <IonTitle style={{ fontWeight: 'bold' }}>{t('profile')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        {/* PROFILE CARD */}
        <IonCard style={{ textAlign: 'center', marginTop: '20px', borderRadius: '16px' }}>
          <IonCardHeader style={{ paddingBottom: '0' }}>
            <IonAvatar style={{ width: '80px', height: '80px', margin: '0 auto' }}>
              <IonIcon icon={personCircleOutline} style={{ fontSize: '80px', color: 'var(--ion-color-medium)' }} />
            </IonAvatar>
            <IonCardTitle style={{ marginTop: '15px', fontWeight: 'bold', fontSize: '1.5em' }}>
              {profile?.name || 'Admin'}
            </IonCardTitle>
            <IonCardSubtitle>{profile?.email}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem lines="none" style={{ '--background': 'transparent', '--padding-start': '0' }}>
              <IonIcon slot="start" icon={businessOutline} color="primary" />
              <IonLabel color="medium">Assigned Branch</IonLabel>
              <IonText slot="end" color="primary" style={{ fontWeight: 'bold' }}>
                {profile?.branch}
              </IonText>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* THEME SETTINGS SECTION */}
        <h3 style={{ marginTop: '30px', fontWeight: 'bold', marginLeft: '10px' }}>{t('appearance')}</h3>
        
        {/* LANGUAGE SELECTOR */}
        <IonCard style={{ margin: '10px 0', borderRadius: '12px' }}>
          <IonItem lines="none">
            <IonIcon slot="start" icon={globeOutline} color="primary" size="large" />
            <IonLabel>{t('language')}</IonLabel>
            <IonSelect value={lang} onIonChange={(e) => setLang(e.detail.value)}>
              <IonSelectOption value="en">{t('english')}</IonSelectOption>
              <IonSelectOption value="fil">{t('filipino')}</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonCard>

        {/* DARK MODE TOGGLE */}
        <IonCard style={{ margin: '10px 0', borderRadius: '12px' }}>
          <IonItem lines="none">
            <IonIcon slot="start" icon={isDarkMode ? moonOutline : sunnyOutline} color={isDarkMode ? "warning" : "primary"} size="large" />
            <IonLabel>
              <h2 style={{ fontWeight: 'bold' }}>{t('darkMode')}</h2>
              <p>Palitan ang kulay ng app</p>
            </IonLabel>
            <IonToggle checked={isDarkMode} onIonChange={toggleTheme} />
          </IonItem>
        </IonCard>

        {/* LOGOUT BUTTON */}
        <IonButton expand="block" color="danger" className="ion-margin-top" onClick={handleLogout} style={{ marginTop: '30px', '--border-radius': '12px', height: '50px', fontWeight: 'bold' }}>
          <IonIcon slot="start" icon={logOutOutline} /> {t('logout')}
        </IonButton>

      </IonContent>
    </IonPage>
  );
};

export default AdminSettings;