import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonSpinner, IonIcon, IonAccordionGroup, IonAccordion, IonList, IonText } from '@ionic/react';
import { globeOutline, sunnyOutline, moonOutline, shieldCheckmarkOutline, callOutline, informationCircleOutline } from 'ionicons/icons';
import { useLanguage } from '../context/LanguageContext';

const ConsumerSettings: React.FC = () => {
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

          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '15px', color: 'var(--ion-text-color)' }}>Help & Info</h2>

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
                  <li>I-check ang schedule at i-charge ang mga power bank bago ang planned outage.</li>
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
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Naujan ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-123-4567</IonText>
                  </IonItem>
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Socorro ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-987-6543</IonText>
                  </IonItem>
                  <IonItem lines="none" style={{ '--background': 'transparent' }}>
                    <IonLabel>Calapan City ORMECO</IonLabel>
                    <IonText slot="end" color="primary">0917-555-1234</IonText>
                  </IonItem>
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

        </div>
      </IonContent>
    </IonPage>
  );
};

export default ConsumerSettings;