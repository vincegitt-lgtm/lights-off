import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonTextarea, IonList, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonBadge, IonCardSubtitle, IonIcon, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { partlySunnyOutline } from 'ionicons/icons';

interface Props {
  adminBranch: string;
}

const ManageAnnouncements: React.FC<Props> = ({ adminBranch }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('scheduled');
  const [affectedAreas, setAffectedAreas] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString());
  const [scheduledTime, setScheduledTime] = useState<string>(new Date().toISOString());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [weatherText, setWeatherText] = useState('Fetching...');

  const getCoordinates = (branch: string) => {
    switch(branch) {
      case 'Naujan': return { lat: 13.3244, lon: 121.3066 };
      case 'Socorro': return { lat: 13.0431, lon: 121.4128 };
      case 'Calapan City': return { lat: 13.4115, lon: 121.1803 };
      default: return { lat: 13.4000, lon: 121.1833 };
    }
  };

  useEffect(() => {
    const fetchAdminWeather = async () => {
      const { lat, lon } = getCoordinates(adminBranch);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=Asia%2FManila`);
        const data = await res.json();
        const temp = data.current.temperature_2m;
        const code = data.current.weather_code;
        let condition = "Clear";
        if (code > 0 && code < 50) condition = "Cloudy";
        if (code >= 51 && code <= 67) condition = "Raining";
        if (code >= 80 && code <= 82) condition = "Heavy Rain";
        if (code >= 95) condition = "Thunderstorm";
        setWeatherText(`${condition} | ${temp}°C`);
      } catch { setWeatherText('Weather data unavailable'); }
    };
    
    if (adminBranch) fetchAdminWeather();

    const q = query(
      collection(db, 'announcements'),
      where('branch', '==', adminBranch)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, [adminBranch]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!title || !description || !affectedAreas) {
      setError('Punan ang Title, Description, at Affected Barangay.');
      return;
    }

    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        description,
        type,
        branch: adminBranch,
        affectedAreas: affectedAreas.split(',').map(area => area.trim()),
        status: 'ongoing',
        scheduledDate: scheduledDate, // I-save ang petsa
        scheduledTime: scheduledTime, // I-save ang oras
        createdBy: auth.currentUser?.uid,
        timestamp: serverTimestamp(),
      });
      setSuccess('Matagumpay na na-post ang announcement!');
      setTitle(''); setDescription(''); setAffectedAreas('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'announcements', id), { status: newStatus });
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonTitle style={{ fontWeight: 'bold' }}>Manage Announcements</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonCard color="light" style={{ margin: '0 0 15px 0' }}>
          <IonCardHeader>
            <IonCardSubtitle>
              <IonIcon icon={partlySunnyOutline} /> Current Weather in {adminBranch}
            </IonCardSubtitle>
            <IonCardTitle style={{ fontSize: '1.2em' }}>{weatherText}</IonCardTitle>
          </IonCardHeader>
        </IonCard>

        <h2>Create New Announcement</h2>
        
        {error && <IonText color="danger"><p>{error}</p></IonText>}
        {success && <IonText color="success"><p>{success}</p></IonText>}

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput value={title} onIonChange={e => setTitle(e.detail.value!)} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Description</IonLabel>
            <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value!)} rows={2} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Type</IonLabel>
            <IonSelect value={type} onIonChange={e => setType(e.detail.value)}>
              <IonSelectOption value="scheduled">Scheduled Outage</IonSelectOption>
              <IonSelectOption value="unexpected">Unexpected Outage</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* DATE AND TIME PICKERS */}
          <IonItem>
            <IonLabel position="stacked">Petsa ng Outage</IonLabel>
            <IonDatetimeButton datetime="date-picker"></IonDatetimeButton>
            <IonModal keepContentsMounted={true}>
              <IonDatetime 
                id="date-picker" 
                presentation="date" 
                value={scheduledDate}
                onIonChange={e => setScheduledDate(e.detail.value as string)}
              ></IonDatetime>
            </IonModal>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Oras ng Outage</IonLabel>
            <IonDatetimeButton datetime="time-picker"></IonDatetimeButton>
            <IonModal keepContentsMounted={true}>
              <IonDatetime 
                id="time-picker" 
                presentation="time" 
                value={scheduledTime}
                onIonChange={e => setScheduledTime(e.detail.value as string)}
              ></IonDatetime>
            </IonModal>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Affected Barangay/s</IonLabel>
            <IonInput value={affectedAreas} onIonChange={e => setAffectedAreas(e.detail.value!)} placeholder="Hal: Brgy. Poblacion, Brgy. Sta. Maria" />
          </IonItem>
        </IonList>
        <IonButton expand="block" className="ion-margin-top" onClick={handleSubmit}>Post Announcement</IonButton>

        <h2 className="ion-margin-top">Current Announcements</h2>
        {announcements.length === 0 ? <p>Walang announcements.</p> : (
          announcements.map((ann) => (
            <IonCard key={ann.id}>
              <IonCardHeader>
                <IonCardTitle>{ann.title}</IonCardTitle>
                <IonBadge color={ann.status === 'ongoing' ? 'warning' : ann.status === 'restored' ? 'success' : 'medium'}>
                  {ann.status.toUpperCase()}
                </IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <p>{ann.description}</p>
                {/* IPAKITA ANG PETSA AT ORAS DITO */}
                {ann.scheduledDate && (
                  <p style={{ fontSize: '0.85em', color: 'gray' }}>
                    <strong>Petsa:</strong> {new Date(ann.scheduledDate).toLocaleDateString()}
                  </p>
                )}
                {ann.scheduledTime && (
                  <p style={{ fontSize: '0.85em', color: 'gray' }}>
                    <strong>Oras:</strong> {new Date(ann.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <p style={{ fontSize: '0.85em', color: 'gray' }}>
                  <strong>Affected Barangay/s:</strong> {ann.affectedAreas?.join(', ')}
                </p>
                {ann.status === 'ongoing' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <IonButton size="small" color="success" onClick={() => updateStatus(ann.id, 'restored')}>Mark as Restored</IonButton>
                    <IonButton size="small" color="danger" onClick={() => updateStatus(ann.id, 'cancelled')}>Cancel</IonButton>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
};

export default ManageAnnouncements;