import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Mail, Pencil } from 'lucide-react';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenTransition } from '../../app/ScreenTransition';
import { profilePhotoOptions, useAuthStore } from '../../store/auth';
import styles from './FillProfileScreen.module.css';

export function FillProfileScreen() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [photoIndex, setPhotoIndex] = useState(0);

  const hasPhoto = Boolean(profile.avatar);
  const canContinue = profile.fullName.trim().length > 1;

  const cyclePhoto = () => {
    if (profilePhotoOptions.length === 0) return;
    const next = profilePhotoOptions[photoIndex % profilePhotoOptions.length];
    setPhotoIndex((value) => value + 1);
    updateProfile({ avatar: next });
  };

  return (
    <ScreenTransition>
      <div className={`screen ${styles.screen}`}>
        <AppBar title="Fill Your Profile" showStatusBar={false} />

        <div className="screen-body">
          <div className={styles.avatarWrap}>
            <Avatar src={profile.avatar} size={120} />
            <button
              type="button"
              className={styles.edit}
              onClick={cyclePhoto}
              aria-label={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
          </div>

          <div className={styles.fields}>
            <Input
              label="Full Name"
              value={profile.fullName}
              onChange={(event) => updateProfile({ fullName: event.target.value })}
            />
            <Input
              label="Nickname"
              value={profile.nickname}
              onChange={(event) => updateProfile({ nickname: event.target.value })}
            />
            <Input
              label="Date of Birth"
              type="date"
              icon={<Calendar size={18} strokeWidth={1.75} />}
              value={profile.dob}
              onChange={(event) => updateProfile({ dob: event.target.value })}
            />
            <Input
              label="Email"
              type="email"
              icon={<Mail size={18} strokeWidth={1.75} />}
              value={profile.email}
              onChange={(event) => updateProfile({ email: event.target.value })}
            />
            <Input
              label="About"
              value={profile.about}
              onChange={(event) => updateProfile({ about: event.target.value })}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            variant="primary"
            shape="pill"
            fullWidth
            disabled={!canContinue}
            onClick={() => navigate('/create-pin')}
          >
            Continue
          </Button>
        </div>
      </div>
    </ScreenTransition>
  );
}
