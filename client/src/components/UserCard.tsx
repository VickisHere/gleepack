```tsx
import React from 'react';

const UserCard = ({ user }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {user.role === 'employee' || user.role === 'influencer' ? (
        <button className="role-btn d-block">
          {user.role}
        </button>
      ) : null}
    </div>
  );
};

export default UserCard;
```