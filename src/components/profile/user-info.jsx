import { useEffect, useState } from "react"
import {
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase"
import { toast } from "react-toastify"

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// ✅ 🔥 MASTER SWITCH — change to true when delivery is ready
const DELIVERY_ENABLED = true

function UserInfo({ user }) {
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [showEditConfirm, setShowEditConfirm] = useState(false)

  const [newEmail, setNewEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")

  const [profile, setProfile] = useState({
    username: "",
    phone: "",
    streetName: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    country: "Netherlands",
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
          streetName: data.address?.streetName || "",
          houseNumber: data.address?.houseNumber || "",
          postalCode: data.address?.postalCode || "",
          city: data.address?.city || "",
          country: data.address?.country || "Netherlands",
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [user.uid])

  /** Update email */
  const handleUpdateEmail = async () => {
    if (updatingEmail || savingProfile) return

    if (!isValidEmail(newEmail)) {
      toast.error("Invalid email address")
      return
    }

    setUpdatingEmail(true)
    try {
      await updateEmail(user, newEmail)
      toast.success("Email updated successfully")
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        if (!currentPassword) {
          toast.error("Enter current password")
          setUpdatingEmail(false)
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
    } finally {
      setUpdatingEmail(false)
    }
  }

  /** Update profile */
  const handleUpdateProfile = async () => {
    if (savingProfile || updatingEmail) return

    setSavingProfile(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          email: newEmail,
          username: profile.username,
          phone: profile.phone,
          address: {
            streetName: profile.streetName,
            houseNumber: profile.houseNumber,
            postalCode: profile.postalCode,
            city: profile.city,
            country: profile.country,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) return <p>Loading profile...</p>

  const inputClass =
    "w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"

  const busy = updatingEmail || savingProfile

  return (
    <div className="space-y-6">
      {/* EDIT CONFIRM MODAL */}
      {showEditConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !busy && setShowEditConfirm(false)}
          />
          <div className="relative bg-white w-[92%] max-w-md rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-bold">Edit Profile?</h3>
            <p className="text-sm text-gray-600 mt-2">
              You’re about to enable editing. Make sure to save your changes when
              you’re done.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowEditConfirm(false)}
                className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setIsEditing(true)
                  setShowEditConfirm(false)
                }}
                className="px-4 py-2 rounded bg-[#7B2220] text-white hover:opacity-90 disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Profile</h1>

        {!isEditing && (
          <button
            onClick={() => setShowEditConfirm(true)}
            className="bg-[#7B2220] hover:opacity-90 text-sm text-white px-4 py-2 rounded disabled:opacity-60"
            disabled={busy}
          >
            Edit
          </button>
        )}
      </div>

      {/* BASIC INFO */}
      <div>
        <h2 className="font-bold text-lg mb-2">Customer Information</h2>

        <input
          disabled={!isEditing || busy}
          placeholder="Username"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          className={`${inputClass} mb-2`}
        />

        <input
          disabled={!isEditing || busy}
          type="tel"
          placeholder="Phone Number"
          value={profile.phone}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* 🚚 DELIVERY ADDRESS */}
      <div>
        <h2 className="font-bold text-lg mb-2">Delivery Address</h2>

        {!DELIVERY_ENABLED ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border">
            <p className="text-lg font-semibold text-gray-700">
              🚚 Delivery Coming Soon
            </p>
            <p className="text-sm text-gray-500 mt-1">
              We're preparing delivery service in your area.
            </p>
          </div>
        ) : (
          <>
            <input
              disabled={!isEditing || busy}
              placeholder="Street Name"
              value={profile.streetName}
              onChange={(e) =>
                setProfile({ ...profile, streetName: e.target.value })
              }
              className={`${inputClass} mb-2`}
            />

            <input
              disabled={!isEditing || busy}
              placeholder="House Number"
              value={profile.houseNumber}
              onChange={(e) =>
                setProfile({ ...profile, houseNumber: e.target.value })
              }
              className={`${inputClass} mb-2`}
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                disabled={!isEditing || busy}
                placeholder="Postal Code (1234 AB)"
                value={profile.postalCode}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    postalCode: e.target.value.toUpperCase(),
                  })
                }
                className={inputClass}
              />
              <input
                disabled={!isEditing || busy}
                placeholder="City"
                value={profile.city}
                onChange={(e) =>
                  setProfile({ ...profile, city: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <input
              disabled={!isEditing || busy}
              placeholder="Country"
              value={profile.country}
              onChange={(e) =>
                setProfile({ ...profile, country: e.target.value })
              }
              className={inputClass}
            />
          </>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <label className="font-semibold">Email</label>
        <input
          disabled={!isEditing || busy}
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className={`${inputClass} mt-1`}
        />

        <input
          disabled={!isEditing || busy}
          type="password"
          placeholder="Current password (for email change)"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={`${inputClass} mt-2`}
        />

        {isEditing && (
          <button
            onClick={handleUpdateEmail}
            disabled={busy}
            className="mt-2 text-sm text-[#7B2220] underline disabled:opacity-60"
          >
            {updatingEmail ? "Updating..." : "Update Email"}
          </button>
        )}
      </div>

      {/* SAVE BUTTON */}
      {isEditing && (
        <button
          onClick={handleUpdateProfile}
          disabled={busy}
          className="bg-[#7B2220] text-white px-6 py-2 rounded hover:opacity-90 disabled:opacity-60"
        >
          {savingProfile ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Profile"
          )}
        </button>
      )}
    </div>
  )
}

export default UserInfo
