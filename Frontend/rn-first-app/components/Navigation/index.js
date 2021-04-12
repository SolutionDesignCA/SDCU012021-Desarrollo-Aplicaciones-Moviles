import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { TabNavigator } from "./TabNavigator";
import { AuthNavigator } from "./AuthNavigator";
import { Loading } from "../Loading/Loading";
import { connect } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import jwtDecode from "jwt-decode";
import NetInfo from "@react-native-community/netinfo";
import * as selectors from "../../reducers";
import * as actions from "../../actions/auth";
import { Alert, ToastAndroid } from "react-native";

const storeData = async (token) => {
  try {
    await AsyncStorage.removeItem("token");
    // const jsonValue = JSON.stringify(token);
    await AsyncStorage.setItem("token", token);
  } catch (e) {
    console.log(e);
  }
};

const getData = async (persist, setIsLoading) => {
  try {
    const jsonValue = await AsyncStorage.getItem("token");
    console.log("token get item", jsonValue);
    const tokenExpired = jsonValue ? isExpired(jsonValue) : null;
    tokenExpired ? persist(null) : persist(jsonValue);
    return jsonValue != null ? jsonValue : setIsLoading();
  } catch (e) {
    console.log(e);
  }
};

const isExpired = (token) => {
  if (token && jwtDecode(token)) {
    const expiry = jwtDecode(token).exp;
    const now = new Date();
    return now.getTime() > expiry * 1000;
  }
  return false;
};

const Main = ({ isAuthenticating, setIsLoading, user, token, persist }) => {
  const [networkConnection, setnetworkConnection] = useState(false);

  console.log("Is connected?", networkConnection);

  if (!networkConnection) {
    ToastAndroid.show("No hay coneccion", ToastAndroid.LONG);
  }

  token ? storeData(token) : null;
  // console.log("token", token);

  let NetInfoSubscripction = null;

  const _handleConnectivityChange = (state) => {
    setnetworkConnection(state.isConnected);
  };

  /**
   * Ya no necesitamos estado local porque lo
   * manejaremos en el estado global
   */
  // const [isLoading, setisLoading] = useState(true);

  // const [user, setUser] = useState(null);

  useEffect(() => {
    // Set isLoading
    // setTimeout(() => {
    //   setIsLoading();
    // }, 500);
    // Set User
    // setTimeout(() => {
    //   setUser({});
    // }, 1000);

    NetInfoSubscripction = NetInfo.addEventListener(_handleConnectivityChange);

    getData(persist, setIsLoading);

    return () => {
      NetInfoSubscripction && NetInfoSubscripction();
    };
  }, []);

  return (
    <NavigationContainer>
      {isAuthenticating ? (
        <Loading />
      ) : user ? (
        <TabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default connect(
  (state) => ({
    isAuthenticating: selectors.getIsAuthenticating(state),
    user: selectors.getAuthUser(state),
    token: selectors.getAuthToken(state),
  }),
  (dispatch) => ({
    setIsLoading() {
      dispatch(actions.completeLogin(null));
    },
    persist(token) {
      console.log("Llega", token);
      dispatch(actions.completeLogin(token));
    },
  })
)(Main);
