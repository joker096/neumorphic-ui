import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { OtpInput } from '../../components/ui/OtpInput';
import { Keypad } from '../../components/ui/Keypad';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Switch';
import { Tabs } from '../../components/ui/Tabs';
import { ListItem } from '../../components/ui/ListItem';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { MessageInput } from '../../components/ui/MessageInput';
import { contacts } from '../../data/mock';
import styles from './KitPage.module.css';

export function KitPage() {
  const [phone, setPhone] = useState('111467378399');
  const [otp, setOtp] = useState('74');
  const [on, setOn] = useState(true);
  const [tab, setTab] = useState('chats');
  const [message, setMessage] = useState('');
  const contact = contacts[0];

  return (
    <div className="screen">
      <div className="screen-body">
        <h1 className={styles.title}>UI kit</h1>

        <section className={styles.block}>
          <Button variant="primary" shape="pill">Primary</Button>
          <Button variant="secondary" shape="rounded">Secondary</Button>
          <Button variant="ghost" shape="rounded">Ghost</Button>
          <Button variant="primary" shape="pill" disabled>Disabled</Button>
        </section>

        <section className={styles.block}>
          <Input label="Full Name" />
          <Input label="Email" error="Enter a valid email" />
          <PhoneInput value={phone} onChange={setPhone} />
          <OtpInput value={otp} onChange={setOtp} length={4} />
        </section>

        <section className={styles.block}>
          <div className={styles.row}>
            <Avatar src={contact?.avatar} name={contact?.name} size={56} />
            <Avatar name="No Photo" size={56} />
            <Badge count={3} />
            <Switch checked={on} onChange={setOn} label="Switch" />
          </div>
          <Tabs
            tabs={[
              { id: 'chats', label: 'Chats', badge: 2 },
              { id: 'status', label: 'Status' },
              { id: 'calls', label: 'Calls' },
            ]}
            value={tab}
            onChange={setTab}
            tone="default"
          />
        </section>

        <section className={styles.block}>
          <ListItem name={contact?.name ?? ''} preview="Can't wait to try it out!" avatar={contact?.avatar} time="20:00" unread={1} />
          <ChatBubble direction="in" text="Wow, this is really epic 👍" time="09:41" />
          <ChatBubble direction="out" text="Can't wait to try it out!" time="09:42" status="read" />
        </section>

        <section className={styles.block}>
          <Keypad onDigit={() => undefined} onBackspace={() => undefined} />
        </section>

        <div className={styles.messageDock}>
          <MessageInput value={message} onChange={setMessage} onSend={() => setMessage('')} onAttach={() => undefined} onCamera={() => undefined} />
        </div>
      </div>
    </div>
  );
}
