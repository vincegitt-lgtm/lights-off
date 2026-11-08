import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { partlySunnyOutline, addCircleOutline, listOutline, alertCircleOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

interface Props {
  adminBranch: string;
}

const AdminDashboard: React.FC<Props> = ({ adminBranch }) => {
  const [adminName, setAdminName] = useState('');
  const [stats, setStats] = useState({ ongoing: 0, pending: 0, action: 0 });
  const [weatherText, setWeatherText] = useState('Fetching...');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getCoordinates = (branch: string) => {
    switch(branch) {
      case 'Naujan': return { lat: 13.3244, lon: 121.3066 };
      case 'Socorro': return { lat: 13.0431, lon: 121.4128 };
      case 'Calapan City': return { lat: 13.4115, lon: 121.1803 };
      default: return { lat: 13.4000, lon: 121.1833 };
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setAdminName(userDoc.data().name);
      }

      const { lat, lon } = getCoordinates(adminBranch);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FManila`);
        const data = await res.json();
        const code = data.current.weather_code;
        let condition = "Clear";
        if (code > 0 && code < 50) condition = "Cloudy";
        if (code >= 51 && code <= 67) condition = "Raining";
        if (code >= 80 && code <= 82) condition = "Heavy Rain";
        if (code >= 95) condition = "Thunderstorm";
        setWeatherText(`${condition} | ${data.current.temperature_2m}°C`);
      } catch { setWeatherText('Unavailable'); }

      setLoading(false);
    };
    fetchAdminData();

    const qAnnouncements = query(collection(db, 'announcements'), where('branch', '==', adminBranch), where('status', '==', 'ongoing'));
    const unsubAnn = onSnapshot(qAnnouncements, (snap) => {
      setStats(prev => ({ ...prev, ongoing: snap.size }));
    });

    const qPending = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'pending'));
    const unsubPen = onSnapshot(qPending, (snap) => {
      setStats(prev => ({ ...prev, pending: snap.size }));
    });

    const qAction = query(collection(db, 'reports'), where('branch', '==', adminBranch), where('status', '==', 'approved'));
    const unsubAct = onSnapshot(qAction, (snap) => {
      setStats(prev => ({ ...prev, action: snap.size }));
    });

    return () => { unsubAnn(); unsubPen(); unsubAct(); };
  }, [adminBranch]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" /></div>;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: '900', letterSpacing: '1px' }}>DASHBOARD</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '5px', color: 'var(--ion-text-color)' }}>
          Hi, {adminName?.split(' ')[0]}!
        </h1>
        <p style={{ color: 'gray', marginTop: '0', fontWeight: '500' }}>Status for <span style={{ color: 'var(--app-green)', fontWeight: 'bold' }}>{adminBranch}</span></p>

        {/* WEATHER CARD - Black with Green accent */}
        <IonCard style={{ backgroundColor: 'var(--app-black)', borderLeft: '6px solid var(--app-green)', margin: '20px 0' }}>
          <IonCardHeader>
            <IonCardSubtitle style={{ color: 'var(--app-green)', fontWeight: '800', letterSpacing: '1.5px' }}>
              <IonIcon icon={partlySunnyOutline} /> CURRENT WEATHER
            </IonCardSubtitle>
            <IonCardTitle style={{ color: '#ffffff', fontSize: '2rem', fontWeight: '900', marginTop: '5px' }}>
              {weatherText}
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>

        {/* STATS CARDS - Black with Yellow numbers */}
        <IonGrid className="ion-no-padding">
          <IonRow>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-black)', margin: '0', textAlign: 'center', borderRadius: '16px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.4rem', fontWeight: '900', margin: '0' }}>{stats.ongoing}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', fontWeight: '600' }}>ACTIVE</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-black)', margin: '0', textAlign: 'center', borderRadius: '16px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.4rem', fontWeight: '900', margin: '0' }}>{stats.pending}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', fontWeight: '600' }}>PENDING</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard style={{ backgroundColor: 'var(--app-black)', margin: '0', textAlign: 'center', borderRadius: '16px' }}>
                <IonCardContent style={{ padding: '15px 5px' }}>
                  <h1 style={{ color: 'var(--app-yellow)', fontSize: '2.4rem', fontWeight: '900', margin: '0' }}>{stats.action}</h1>
                  <p style={{ color: '#ffffff', fontSize: '0.75rem', margin: '5px 0 0 0', fontWeight: '600' }}>TO FIX</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <h2 className="ion-margin-top" style={{ fontWeight: '900', marginBottom: '15px' }}>Quick Actions</h2>
        
        {/* GREEN BUTTON */}
        <IonButton 
          expand="block" 
          onClick={() => navigate('/admin/announcements')} 
          style={{ '--background': 'var(--app-green)', '--color': '#ffffff', height: '55px', fontWeight: '900', marginBottom: '12px', '--border-radius': '12px' }}
        >
          <IonIcon slot="start" icon={addCircleOutline} /> POST ANNOUNCEMENT
        </IonButton>
        
        {/* OUTLINE BLACK BUTTON */}
        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={() => navigate('/admin/reports')} 
          style={{ '--border-color': 'var(--app-black)', '--color': 'var(--app-black)', height: '55px', fontWeight: '900', marginBottom: '12px', '--border-radius': '12px' }}
        >
          <IonIcon slot="start" icon={listOutline} /> REVIEW REPORTS
        </IonButton>
        
        {/* YELLOW BUTTON */}
        <IonButton 
          expand="block" 
          onClick={() => navigate('/admin/action')}
          style={{ '--background': 'var(--app-yellow)', '--color': '#000000', height: '55px', fontWeight: '900', '--border-radius': '12px' }}
        >
          <IonIcon slot="start" icon={alertCircleOutline} /> ACTION REQUIRED
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;