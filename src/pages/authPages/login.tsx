import { useForm, Controller } from 'react-hook-form'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Button, Typography, Paper,InputAdornment,IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import * as z from 'zod';
import {  Link as RouterLink } from "react-router";
import Link from '@mui/material/Link'; 
import {handleCurrentUser} from "../../redux/slice/authSlice"
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux'
import type{RootState} from '../../redux/store'
import { useNavigate } from "react-router";
import { useState } from 'react';
import {  signInWithEmailAndPassword   } from 'firebase/auth';
import { auth, googleProvider ,db} from '../../firebase/firebase';  
import { signInWithPopup } from 'firebase/auth';
import { collection, addDoc, serverTimestamp,getDocs , query,where } from "firebase/firestore";






function Login() {
  let navigate = useNavigate();
  const {enqueueSnackbar} = useSnackbar()
   const [showPassword, setShowPassword] = useState(false);
  // console.log(users);
  const dispatch = useDispatch()
  const singupschema = z.object({
    email: z
      .string()
      .min(1, 'User Name is required')
      .email("This is not a valid email."),
    password: z
      .string()
      .trim()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
      
  });
  type loginInterface = z.z.infer<typeof singupschema>

  const {
    control, 
    handleSubmit,
    formState: { errors },
  } = useForm<loginInterface>({
    resolver: zodResolver(singupschema),
    defaultValues: {
      email: '',
      password: '',

    },
  });


const onSubmit = (user:loginInterface)=>{

    // console.log('usersss',user)
    // const existing = Users.find((i)=>i.userName==user.username )
    // console.log(existing)
    // if(existing){

    // dispatch(handleCurrentUser(existing))
    
    // navigate("/Dashboard")
  
    // }else{
    //   enqueueSnackbar('Invalid Credentials', {autoHideDuration: 3000})
    // }

     signInWithEmailAndPassword(auth, user.email, user.password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            navigate("/Dashboard")
            console.log(user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage)
        });
  
}
  const signInWithGoogle = async () => {
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const firebaseUser = response.user;
      const existingQuery = query(
      collection(db, "users"),
      where("email", "==", firebaseUser.email)
    );
     const existed = await getDocs(existingQuery);

      if (!existed) {
      await addDoc(collection(db, "users"), {
        id: firebaseUser.uid,
        userName: firebaseUser.displayName || null,
        email: firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        provider: "google",
        createdAt: serverTimestamp(),
      });}

      dispatch(
        handleCurrentUser({
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        })
      );

      navigate("/Dashboard");
      enqueueSnackbar("Signed in with Google!", { autoHideDuration: 3000 });
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      enqueueSnackbar(error.message, { autoHideDuration: 3000 });
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper elevation={3} sx={{ 
          p: 4, width: '100%', maxWidth: 400 ,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          boxShadow:'2'
          
          }}>
          <img src='https://freepngimg.com/thumb/logo/69662-instagram-media-brand-social-logo-photography.png' alt="Company Logo" width="300" height="150"/>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field} 
                  label="Email"
                  variant="filled"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
               name="password"
               control={control}
               render={({ field }) => (
               <TextField
                {...field}
                 label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="filled"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 2,width: 400 }}
                  InputProps={{
                   endAdornment: (
                 <InputAdornment position="end">
                 <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                     >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                     </InputAdornment>
                       )
                      }}
                     />
                   )}
                />


            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              Login
            </Button>
            <Button
              onClick={signInWithGoogle}
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 2 }}
            >
              Sign in with Google
            </Button>
          </form>
          <Typography variant="h4" component="h2"  fontSize="15px" sx={{ fontStyle: 'italic' ,m:4 }} >
            Already have accout<Link component={RouterLink} to="/Register" underline="hover" sx={{ marginLeft: '5px' }} >Singup</Link>
          </Typography>
        </Paper>
      </Box>
      
    </>
  );
}

export default Login

