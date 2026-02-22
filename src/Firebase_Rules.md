rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    // ✅ role-based admin (NO hardcoded UID)
    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    // ✅ username registry (for availability check)
    match /usernames/{name} {
      allow get: if true;         // anyone can check a username
      allow list: if false;       // block dumping
      allow create: if signedIn(); // registered user can reserve
      allow delete: if isAdmin();
    }

    match /users/{userId} {
      // allow user to read their own doc, admin can read any
      allow get: if signedIn() && (request.auth.uid == userId || isAdmin());

      // allow admin to list users
      allow list: if isAdmin();

      // user can create/update their own doc, admin can do all
      allow create, update, delete: if signedIn() && (request.auth.uid == userId || isAdmin());

      match /cartItems/{itemId} {
        allow read, write: if signedIn() && request.auth.uid == userId;
      }

      match /wishlist/{wishId} {
        allow read, write: if signedIn() && request.auth.uid == userId;
      }
      
      // 🔔 NOTIFICATIONS - Fixed to allow admin to create notifications
      match /notifications/{notificationId} {
        // User can read their own notifications, admin can read any
        allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
        
        // ✅ FIXED: Allow admin to create notifications for users
        allow create: if isAdmin();
        
        // Only user can delete their own notifications
        allow delete: if signedIn() && request.auth.uid == userId;
        
        // User can update their own notifications (mark as read), admin can update any
        allow update: if signedIn() && (
          (request.auth.uid == userId && 
           request.resource.data.diff(resource.data).changedKeys().hasOnly(['read'])) ||
          isAdmin()
        );
      }
    }

    match /orders/{orderId} {
      allow create: if signedIn()
        && request.resource.data.userId == request.auth.uid;

      // ✅ allow admin OR owner to read
      allow read: if signedIn()
        && (request.auth.uid == resource.data.userId || isAdmin());

      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
      
      // Allow users to create reviews for products they've ordered
      match /reviews/{reviewId} {
        allow read: if true;
        allow create: if signedIn();
        allow update, delete: if signedIn() && 
          (resource.data.userId == request.auth.uid || isAdmin());
      }
    }

    match /pages/{pageId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /ratings/{doc} {
      allow create: if request.auth != null;
      allow read: if true;
    }
    
    // ✅ Admin Notifications - Allow authenticated users to create, only admins can read/update/delete
    match /adminNotifications/{notificationId} {
      // Allow any authenticated user to create notifications (for return requests, etc.)
      allow create: if signedIn();
      
      // Only admins can read notifications
      allow read: if isAdmin();
      
      // Only admins can update/delete notifications
      allow update, delete: if isAdmin();
    }
  }
}