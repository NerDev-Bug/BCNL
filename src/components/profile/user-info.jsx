import { useEffect, useState } from "react"
import {
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase"
import { toast } from "react-toastify"

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

function UserInfo({ user }) {
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // AUTH
  const [newEmail, setNewEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")

  // PROFILE (Firestore)
  const [profile, setProfile] = useState({
    username: "",
    phone: "",
    street: "",
    postalCode: "",
    city: "",
    country: "Netherlands"
  })

  /** Load user profile */
  useEffect(() => {
    const loadProfile = async () => {
      const ref = doc(db, "users", user.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()
        setProfile({
          username: data.username || "",
          phone: data.phone || "",
          street: data.address?.street || "",
          postalCode: data.address?.postalCode || "",
          city: data.address?.city || "",
          country: data.address?.country || "Netherlands"
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [user.uid])

  /** Update email (Auth) */
  const handleUpdateEmail = async () => {
    if (!isValidEmail(newEmail)) {
      toast.error("Invalid email address")
      return
    }

    try {
      await updateEmail(user, newEmail)
      toast.success("Email updated successfully")
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        if (!currentPassword) {
          toast.error("Enter current password")
          return
        }

        try {
          const credential = EmailAuthProvider.credential(
            user.email,
            currentPassword
          )
          await reauthenticateWithCredential(user, credential)
          await updateEmail(user, newEmail)
          toast.success("Email updated successfully")
          setCurrentPassword("")
        } catch {
          toast.error("Incorrect password")
        }
      } else {
        toast.error(err.message)
      }
    }
  }

  /** Update profile (Firestore) */
  const handleUpdateProfile = async () => {
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: newEmail,
          username: profile.username,
          phone: profile.phone,
          address: {
            street: profile.street,
            postalCode: profile.postalCode,
            city: profile.city,
            country: profile.country
          },
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )

      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch {
      toast.error("Failed to update profile")
    }
  }

  if (loading) return <p>Loading profile...</p>

  const inputClass =
    "w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Profile</h1>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-[#7B2220] underline"
          >
            Edit
          </button>
        )}
      </div>

      {/* BASIC INFO */}
      <div>
        <h2 className="font-bold text-lg mb-2">Customer Information</h2>

        <input
          disabled={!isEditing}
          placeholder="Username"
          value={profile.username}
          onChange={(e) =>
            setProfile({ ...profile, username: e.target.value })
          }
          className={`${inputClass} mb-2`}
        />

        <input
          disabled={!isEditing}
          type="tel"
          placeholder="Phone Number"
          value={profile.phone}
          onChange={(e) =>
            setProfile({ ...profile, phone: e.target.value })
          }
          className={inputClass}
        />
      </div>

      {/* ADDRESS */}
      <div>
        <h2 className="font-bold text-lg mb-2">Delivery Address</h2>

        <input
          disabled={!isEditing}
          placeholder="Street Name + House Number"
          value={profile.street}
          onChange={(e) =>
            setProfile({ ...profile, street: e.target.value })
          }
          className={`${inputClass} mb-2`}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            disabled={!isEditing}
            placeholder="Postal Code"
            value={profile.postalCode}
            onChange={(e) =>
              setProfile({ ...profile, postalCode: e.target.value })
            }
            className={inputClass}
          />
          <input
            disabled={!isEditing}
            placeholder="City"
            value={profile.city}
            onChange={(e) =>
              setProfile({ ...profile, city: e.target.value })
            }
            className={inputClass}
          />
        </div>

        <input
          disabled={!isEditing}
          placeholder="Country"
          value={profile.country}
          onChange={(e) =>
            setProfile({ ...profile, country: e.target.value })
          }
          className={`${inputClass} mt-2`}
        />
      </div>

      {/* EMAIL (UNCHANGED LOGIC) */}
      <div>
        <label className="font-semibold">Email</label>
        <input
          disabled={!isEditing}
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className={`${inputClass} mt-1`}
        />

        <input
          disabled={!isEditing}
          type="password"
          placeholder="Current password (for email change)"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={`${inputClass} mt-2`}
        />

        {isEditing && (
          <button
            onClick={handleUpdateEmail}
            className="mt-2 text-sm text-[#7B2220] underline"
          >
            Update Email
          </button>
        )}
      </div>

      {/* SAVE BUTTON */}
      {isEditing && (
        <button
          onClick={handleUpdateProfile}
          className="bg-[#7B2220] text-white px-6 py-2 rounded hover:opacity-90"
        >
          Save Profile
        </button>
      )}
    </div>
  )
}

export default UserInfo