import { Alert } from "react-native";

export function notifySuccess(message: string, title = "Success") {
  Alert.alert(title, message);
}

export function notifyError(message: string, title = "Error") {
  Alert.alert(title, message);
}
