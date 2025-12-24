import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const ProfileModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const { apiFetch, user, token, logout } = useAuthContext();
  const [profile, setProfile] = useState<{ id?: string; email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!apiFetch) return;
    setLoading(true);
    apiFetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [open, apiFetch]);

  async function save() {
    if (!apiFetch || !profile) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ name: profile.name }) });
      const data = await res.json();
      setProfile(data);
      onOpenChange(false); // Close the modal after successful save
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {loading ? (
            <div>Loading...</div>
          ) : profile ? (
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="text-sm text-muted-foreground">{profile.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">User ID</label>
                <div className="text-sm text-muted-foreground">{profile.id}</div>
              </div>
            </div>
          ) : (
            <div>No profile available.</div>
          )}
        </div>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={save} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
