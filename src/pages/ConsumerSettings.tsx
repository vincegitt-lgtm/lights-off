import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonText, IonSpinner, IonAvatar, IonCard, IonCardHeader, IonCardContent, IonSelect, IonSelectOption, IonToggle, IonAccordionGroup, IonAccordion, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { logOutOutline, personCircleOutline, businessOutline, moonOutline, sunnyOutline, shieldCheckmarkOutline, callOutline, informationCircleOutline, globeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const ConsumerSettings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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
          setProfile({ id: userDoc.id, ...userDoc.data() });
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

  const handleBranchChange = async (newBranch: string) => {
    if (!profile) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', profile.id), { branch: newBranch });
      setProfile({ ...profile, branch: newBranch });
      alert('Matagumpay na napalitan ang branch!');
    } catch (error) {
      alert('Error sa pag-update ng branch.');
    } finally {
      setUpdating(false);
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
        
        <IonCard style={{ textAlign: 'center', marginTop: '20px', borderRadius: '16px' }}>
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
            <IonItem lines="none" style={{ '--background': 'transparent', '--padding-start': '0' }}>
              <IonIcon slot="start" icon={businessOutline} color="primary" />
              <IonLabel color="medium">{t('branch')}</IonLabel>
              <IonSelect value={profile?.branch} onIonChange={(e) => handleBranchChange(e.detail.value)} disabled={updating}>
                <IonSelectOption value="Naujan">Naujan</IonSelectOption>
                <IonSelectOption value="Socorro">Socorro</IonSelectOption>
                <IonSelectOption value="Calapan City">Calapan City</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        <h3 style={{ marginTop: '30px', fontWeight: 'bold', marginLeft: '10px' }}>{t('appearance')}</h3>
        
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

        <h3 style={{ marginTop: '30px', fontWeight: 'bold', marginLeft: '10px' }}>Help & Info</h3>
        
        <IonAccordionGroup>
          <IonAccordion value="safety">
            <IonItem slot="header" color="light">
              <IonIcon slot="start" icon={shieldCheckmarkOutline} />
              <IonLabel>Safety Tips</IonLabel>
            </IonItem>
            <div className="ion-padding" slot="content">
              <ul style={{ paddingLeft: '20px', fontSize: '0.9em', color: 'var(--ion-text-color)' }}>
                <li>I-unplug ang mga appliances para maiwasan ang short circuit pagbalik ng kuryente.</li>
                <li>Mag-ingat sa paggamit ng kandila. Huwag iwanang nakasindi nang walang tao.</li>
                <li>Mag-imbak ng tubig at flashlight na may extra batteries.</li>
              </ul>
            </div>
          </IonAccordion>

          <IonAccordion value="contacts">
            <IonItem slot="header" color="light">
              <IonIcon slot="start" icon={callOutline} />
              <IonLabel>Emergency Hotlines</IonLabel>
            </IonItem>
            <div className="ion-padding" slot="content">
              <p style={{ fontSize: '0.9em', color: 'var(--ion-text-color)' }}>
                Para sa mga emergency at outage reports, tumawag sa inyong local na ORMECO branch:
              </p>
              <IonList style={{ background: 'transparent' }}>
                {profile?.branch === 'Naujan' && (
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Naujan ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-123-4567</IonText>
                  </IonItem>
                )}
                {profile?.branch === 'Socorro' && (
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Socorro ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-987-6543</IonText>
                  </IonItem>
                )}
                {profile?.branch === 'Calapan City' && (
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Calapan City ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-555-1234</IonText>
                  </IonItem>
                )}
              </IonList>
            </div>
          </IonAccordion>

          <IonAccordion value="about">
            <IonItem slot="header" color="light">
              <IonIcon slot="start" icon={informationCircleOutline} />
              <IonLabel>About LightsOff</IonLabel>
            </IonItem>
            <div className="ion-padding" slot="content">
              <p style={{ fontSize: '0.9em', color: 'var(--ion-text-color)' }}>
                <strong>LightsOff</strong> ay isang mobile application na dinisenyo para magbigay ng tamang oras na impormasyon tungkol sa mga scheduled at unexpected na power outage sa Oriental Mindoro.
              </p>
              <p style={{ fontSize: '0.8em', color: 'gray' }}>Version 1.0.0</p>
            </div>
          </IonAccordion>
        </IonAccordionGroup>

        <IonButton expand="block" color="danger" className="ion-margin-top" onClick={handleLogout} style={{ marginTop: '30px', '--border-radius': '12px', height: '50px', fontWeight: 'bold' }}>
          <IonIcon slot="start" icon={logOutOutline} /> {t('logout')}
        </IonButton>

      </IonContent>
    </IonPage>
  );
};

export default ConsumerSettings;