import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { db, auth } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { handleCurrentUser } from "../../redux/slice/authSlice";
import "./editProfile.css";
import { useNavigate } from "react-router";

const ProfileSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  photoUrl: z.string().url("Invalid image URL").optional(),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

function EditProfile() {
  const currentUser = useSelector((state: RootState) => state.auth.currentUser);
  const dispatch = useDispatch();
  const [imagePreview, setImagePreview] = useState<string>(currentUser?.photoUrl || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      userName: currentUser?.userName || "",
      email: currentUser?.email || "",
      photoUrl: currentUser?.photoUrl || "",
    },
  });


  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        userName: data.userName,
        photoUrl: data.photoUrl,
      });

      await updateProfile(auth.currentUser!, {
        displayName: data.userName,
        photoURL: data.photoUrl,
      });

      dispatch(
        handleCurrentUser({
          ...currentUser,
          userName: data.userName,
          photoUrl: data.photoUrl,
        })
      );

      alert("Profile updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="edit-container">
      <h2>Edit Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)}>

        <div className="profile-image-section">
          <img
            src={imagePreview || "/defaultImg.jpg"}
            width="100"
            height="100"
            style={{ borderRadius: "50%", objectFit: "cover" }}
            onError={(e) => (e.currentTarget.src = "/defaultImg.jpg")}
          />
        </div>

        <div className="form-group">
          <label>Profile Image URL</label>
          <input type="text" {...register("photoUrl")} placeholder="Enter image URL" />
          {errors.photoUrl && <p className="error-text">{errors.photoUrl.message}</p>}
        </div>

        <div className="form-group">
          <label>Email (cannot edit)</label>
          <input type="email" disabled {...register("email")} />
        </div>

        <div className="form-group">
          <label>Username</label>
          <input type="text" {...register("userName")} />
          {errors.userName && <p className="error-text">{errors.userName.message}</p>}
        </div>

        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
      <button className="home-btn" onClick={()=>navigate('/Dashboard')}> Back to Dashboard</button>
    </div>
  );
}

export default EditProfile;
