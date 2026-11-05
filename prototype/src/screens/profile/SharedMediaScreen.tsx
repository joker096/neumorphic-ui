import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar } from '../../components/ui/AppBar';
import { ScreenTransition } from '../../app/ScreenTransition';
import { contacts, sharedDocuments, sharedLinks, sharedMedia } from '../../data/mock';
import { PhotoLightbox } from '../chats/PhotoLightbox';
import styles from './SharedMediaScreen.module.css';

const TABS = ['Media', 'Links', 'Documents'];

export function SharedMediaScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const contact = contacts.find((item) => item.id === id) ?? contacts[0];
  const [tab, setTab] = useState('Media');
  const [photo, setPhoto] = useState<string | null>(null);

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar tone="blue" title={contact.name} onBack={() => navigate(`/contact/${id}`)} />

        <div className={styles.tabs} role="tablist">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              className={tab === item ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="screen-body">
          {tab === 'Media' &&
            sharedMedia.map((group) => (
              <section key={group.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>{group.label}</h2>
                <div className={styles.grid}>
                  {group.images.map((src) => (
                    <button key={src} type="button" className={styles.tile} onClick={() => setPhoto(src)} aria-label="Open photo">
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </section>
            ))}

          {tab === 'Links' && (
            <ul className={styles.list}>
              {sharedLinks.map((link) => (
                <li key={link.id} className={styles.row}>
                  <span className={styles.rowIcon}>🔗</span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{link.title}</span>
                    <span className={styles.rowMeta}>{link.url}</span>
                  </span>
                  <span className={styles.rowDate}>{link.date}</span>
                </li>
              ))}
            </ul>
          )}

          {tab === 'Documents' && (
            <ul className={styles.list}>
              {sharedDocuments.map((doc) => (
                <li key={doc.id} className={styles.row}>
                  <span className={styles.rowIcon}>📄</span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowTitle}>{doc.title}</span>
                    <span className={styles.rowMeta}>{doc.meta}</span>
                  </span>
                  <span className={styles.rowDate}>{doc.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <PhotoLightbox src={photo} onClose={() => setPhoto(null)} />
      </div>
    </ScreenTransition>
  );
}
