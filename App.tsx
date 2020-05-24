/* eslint-disable react/prop-types */
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable comma-dangle */
/* eslint-disable object-curly-newline */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-unresolved */
import * as React from 'react';
import {
  StyleSheet,
  AsyncStorage,
  Button,
  Text,
  TextInput,
  View,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import colors from './src/helpers/colors';

const styles = StyleSheet.create({
  input: {
    height: 42,
    width: Dimensions.get('screen').width - 48,
    backgroundColor: 'white',
    padding: 8,
    marginBottom: 12,
  },
});

interface User {
  username: string;
  password: string;
  picture: string;
}

const AuthContext = React.createContext();

const SplashScreen = () => (
  <SafeAreaView>
    <Text>Loading...</Text>
  </SafeAreaView>
);

const HomeScreen = (props) => {
  const { signOut } = React.useContext(AuthContext);

  return (
    <View>
      <Text>Hello {props.route.params.data.username}</Text>
      <Button title="Sign out" onPress={signOut} />
    </View>
  );
};

interface AuthScreen {
  navigation: any;
}

const AuthScreen: React.FunctionComponent<AuthScreen> = ({
  navigation,
}): React.ReactElement => {
  console.log('auth');
  return (
    <View>
      <Button title="Sign in" onPress={() => navigation.navigate('SignIn')} />
      <Button title="Sign up" onPress={() => navigation.navigate('SignUp')} />
    </View>
  );
};

const SignUpScreen = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [picture, setPicture] = React.useState<string | null>(null);

  const { signUp } = React.useContext(AuthContext);

  React.useEffect(() => {
    const getPermission = async () => {
      if (Constants.platform?.ios) {
        const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (status !== 'granted') {
          console.log('sorry');
        }
      }
    };

    getPermission();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.cancelled) {
        setPicture(result.uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', flexDirection: 'column' }}>
      <View style={{ padding: 12 }}>
        <TouchableOpacity
          onPress={() => pickImage()}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 100,
            width: 100,
            borderRadius: 100,
            backgroundColor: colors.lightGray,
          }}
        >
          {picture ? (
            <Image
              source={{ uri: picture }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 100,
              }}
            />
          ) : (
            <MaterialIcons name="add-a-photo" size={24} color={colors.gray} />
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Sign up"
        onPress={() => signUp({ username, password, picture })}
        disabled={!!(!username.length || !password.length || !picture)}
      />
    </View>
  );
};

const SignInScreen = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const { signIn } = React.useContext(AuthContext);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        flexDirection: 'column',
        paddingTop: 12,
      }}
    >
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Sign in"
        onPress={() => signIn({ username, password })}
        disabled={!!(!username.length || !password.length)}
      />
    </View>
  );
};

const Stack = createStackNavigator();

export default function App() {
  const [state, dispatch] = React.useReducer(
    (prevState: any, action: any) => {
      console.log(action);
      switch (action.type) {
        case 'RESTORE_USER_DATA':
          return {
            ...prevState,
            data: action.data,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            data: action.data,
            isSignout: false,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            data: null,
            isSignout: true,
          };
        default:
          return prevState;
      }
    },
    {
      data: null,
      isLoading: true,
      isSignout: false,
    }
  );

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      const userData = await AsyncStorage.getItem('@userData');

      dispatch({
        type: 'RESTORE_USER_DATA',
        data: userData ? JSON.parse(userData) : null,
      });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (data: User) => {
        await AsyncStorage.setItem('@userData', JSON.stringify(data));

        dispatch({ type: 'SIGN_IN', action: { data } });
      },
      signOut: async () => {
        await AsyncStorage.removeItem('@userData');

        dispatch({ type: 'SIGN_OUT' });
      },
      signUp: async (data: Omit<User, 'picture'>) => {
        await AsyncStorage.getItem('@users').then(async (users) => {
          console.log(users);
          if (Array.isArray(users)) {
            const updatedUsers = [data, ...users];

            await AsyncStorage.setItem('@users', JSON.stringify(updatedUsers));
          } else {
            await AsyncStorage.setItem('@users', JSON.stringify(data));
          }
          dispatch({ type: 'SIGN_UP', data });
        });
      },
    }),
    []
  );

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.isLoading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : state.data == null ? (
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{
                title: 'Auth',
                animationTypeForReplace: state.isSignout ? 'pop' : 'push',
              }}
            />
          ) : (
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              initialParams={state}
            />
          )}
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{
              title: 'Sign in',
              animationTypeForReplace: state.isSignout ? 'pop' : 'push',
            }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{
              title: 'Sign up',
              animationTypeForReplace: state.isSignout ? 'pop' : 'push',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
