import { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonText, IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { downloadOutline } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  adminBranch: string;
}

const ManageReports: React.FC<Props> = ({ adminBranch }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    const q = query(
      collection(db, 'reports'), 
      where('branch', '==', adminBranch)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData: any[] = [];
      snapshot.forEach((doc) => {
        reportsData.push({ id: doc.id, ...doc.data() });
      });
      reportsData.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setReports(reportsData);
    });

    return () => unsubscribe();
  }, [adminBranch]);

  const handleAction = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), {
        status: newStatus,
        verifiedBy: auth.currentUser?.uid,
      });
    } catch (error) {
      console.error("Error updating report: ", error);
    }
  };

  // History filter: rejected lang (kasi ang resolved ay sa Action tab na)
  const filteredReports = reports.filter(r => 
    filter === 'pending' ? r.status === 'pending' : r.status === 'rejected'
  );

  const downloadHistoryPDF = () => {
    if (filteredReports.length === 0) {
      alert("Walang history na idadownload.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Rejected Reports - ${adminBranch}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = filteredReports.map((r) => [
      r.barangay,
      r.description,
      r.status.toUpperCase(),
      r.userName || 'Anonymous',
      new Date(r.timestamp?.toMillis()).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Barangay', 'Description', 'Status', 'Reported By', 'Date']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`History_${adminBranch}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Manage Reports</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as any)} style={{ marginBottom: '20px' }}>
          <IonSegmentButton value="pending">
            <IonLabel>Pending</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="history">
            <IonLabel>History (Rejected)</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {filter === 'history' && filteredReports.length > 0 && (
          <IonButton expand="block" color="tertiary" onClick={downloadHistoryPDF} style={{ marginBottom: '20px' }}>
            <IonIcon slot="start" icon={downloadOutline} />
            Download Rejected History as PDF
          </IonButton>
        )}

        {filteredReports.length === 0 ? (
          <IonText color="medium">
            <p>{filter === 'pending' ? 'Walang pending reports.' : 'Wala pang rejected reports.'}</p>
          </IonText>
        ) : (
          filteredReports.map((report) => (
            <IonCard key={report.id} className="ion-margin-bottom">
              <IonCardHeader>
                <IonCardTitle>{report.barangay}</IonCardTitle>
                <IonBadge color={
                  report.status === 'pending' ? 'warning' : 'danger'
                }>
                  {report.status.toUpperCase()}
                </IonBadge>
              </IonCardHeader>
              <IonCardContent>
                <p>{report.description}</p>
                <p style={{ fontSize: '0.8em', color: 'gray' }}>
                  <strong>Reported by:</strong> {report.userName || 'Anonymous'}
                </p>
                
                {report.latitude && report.longitude && (
                  <div style={{ height: '150px', width: '100%', marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[report.latitude, report.longitude]} />
                    </MapContainer>
                  </div>
                )}
                
                {report.status === 'pending' && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <IonButton color="success" size="small" expand="block" style={{ flex: 1 }} onClick={() => handleAction(report.id, 'approved')}>
                      Approve
                    </IonButton>
                    <IonButton color="danger" size="small" expand="block" style={{ flex: 1 }} onClick={() => handleAction(report.id, 'rejected')}>
                      Reject
                    </IonButton>
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

export default ManageReports;