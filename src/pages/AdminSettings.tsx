import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonSpinner, IonIcon } from '@ionic/react';
import { globeOutline, sunnyOutline, moonOutline } from 'ionicons/icons';
import { useLanguage } from '../context/LanguageContext';

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.body.classList.remove('dark');
    }
    setLoading(false);
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '20px', backgroundColor: 'var(--ion-background-color)' }}>
          
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--ion-text-color)' }}>Appearance</h2>
          
          <IonCard style={{ marginBottom: '10px', borderRadius: '12px' }}>
            <IonItem lines="none">
              <IonIcon slot="start" icon={globeOutline} color="primary" size="large" />
              <IonLabel>Language</IonLabel>
              <IonSelect value={lang} onIonChange={(e) => setLang(e.detail.value)}>
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="fil">Filipino</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCard>

          <IonCard style={{ marginBottom: '20px', borderRadius: '12px' }}>
            <IonItem lines="none">
              <IonIcon slot="start" icon={isDarkMode ? moonOutline : sunnyOutline} color={isDarkMode ? "warning" : "primary"} size="large" />
              <IonLabel>
                <h2 style={{ fontWeight: 'bold' }}>Dark Mode</h2>
                <p>Palitan ang kulay ng app</p>
              </IonLabel>
              <IonToggle checked={isDarkMode} onIonChange={toggleTheme} />
            </IonItem>
          </IonCard>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminSettings;