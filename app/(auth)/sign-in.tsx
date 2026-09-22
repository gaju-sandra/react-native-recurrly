import React from 'react';
import { View, Text } from 'react-native';
import {Link} from 'expo-router';
const SignIn = () => {
 return (
        <View>
            <Text>sign-in</Text>
            <Link href= "/sign-up">Create account </Link>
    </View>
  );
};

export default SignIn;
