import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonSpinner } from '@ionic/react';
import { useLanguage } from '../context/LanguageContext';

const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark');
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
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111', margin: '0 0 20px 0' }}>Settings</h1>

          <IonCard style={{ margin: '0 0 15px 0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel>
                  <h2 style={{ fontWeight: 'bold', fontSize: '1rem' }}>Outage notifications</h2>
                  <p style={{ fontSize: '0.85em' }}>Alert me about new announcements</p>
                </IonLabel>
                <IonToggle checked={notifications} onIonChange={(e) => setNotifications(e.detail.checked)} color="success" />
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ margin: '0 0 15px 0', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <IonCardContent>
              <IonLabel style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>Appearance</IonLabel>
              
              <IonItem lines="none" style={{ marginBottom: '10px' }}>
                <IonLabel>Theme</IonLabel>
                <IonSelect value={isDarkMode ? 'dark' : 'light'} onIonChange={(e) => toggleTheme({ detail: { checked: e.detail.value === 'dark' } })}>
                  <IonSelectOption value="light">Light</IonSelectOption>
                  <IonSelectOption value="dark">Dark</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem lines="none">
                <IonLabel>Language</IonLabel>
                <IonSelect value={lang} onIonChange={(e) => setLang(e.detail.value)}>
                  <IonSelectOption value="en">English</IonSelectOption>
                  <IonSelectOption value="fil">Filipino</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminSettings;