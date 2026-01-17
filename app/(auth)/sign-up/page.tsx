'use client'
import AuthForm from '@/components/AuthForm'
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React, { useState, useCallback } from 'react'

const SignUp = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleSignUpSuccess = useCallback(async () => {
    try {
      // Small delay to ensure session is fully set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = await getLoggedInUser();
      
      setLoggedInUser(user);
    } catch (error) {
      console.error('Error fetching logged in user:', error);
    }
  }, []);

  return (
    <section className="flex-center size-full max-sm:px-6">
      <AuthForm type="sign-up" onSignUpSuccess={handleSignUpSuccess} />
    </section>
  )
}

export default SignUp