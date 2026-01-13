import { createSlice } from '@reduxjs/toolkit'

type initialType={
    currentUser:{
      id:string,
        userName:string,
        email:string,
        photoUrl:string
    }|null
}

const initialState:initialType = {
    currentUser: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialState,
  reducers: {
    // handleRegister(state,action){
    //     state.users.push(
    //     action.payload
    //     )
    // },
    handleCurrentUser (state,action){
        state.currentUser = action.payload

    },
    handleLogout (state){
      state.currentUser=null
    }

    },
    
  },
)

export const { handleCurrentUser,handleLogout }  = authSlice.actions
export default authSlice.reducer