import { StyleSheet } from "react-native";

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F3F4F6",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  weatherContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  weatherText: {
    fontSize: 18,
    marginTop: 10,
  },

  dataText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
  RiceLandTitle: {
    color: "#000",
    zIndex: 1,
    fontWeight: 700,
    textShadowColor: "#fff",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    fontSize: 30,
    textAlign: "center",
  },

  RiceLandScrollContainer: {
    gap: 10,
  },

  mainDetailContainer: {
    backgroundColor: '#ffff',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderRadius: 30,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },

  titleHeaderContainer: {
    backgroundColor: "#4CAF50",
    paddingTop: 20,
    paddingBottom: 20,
  },

  RiceLandItem: {
    height: 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 10,
    overflow: "hidden",
  },

  whiteTitle: {
    color: "#fff",
    textAlign: "center",
  },

  RiceLandContainer: {
    height: 560,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  moreOptionsButtonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 0,
    borderRadius: 99,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },

  menuButton: {
    backgroundColor: "#4CAF50",
    color: "#fff",
  },

  activityIndicator: {
    color: "#4CAF50"
  },

  TitleContainer: {
    paddingTop: 20,
    backgroundColor: "#FFFF",
    borderBottomColor: "#d8d8d8",
    borderBottomWidth: 1,
  },

  RiceLandCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
  },

  FormContainer: {
    paddingTop: 10,
  },

  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
    backgroundColor: "#A6A6A6",
    padding: 20,
  },

  noDataTextContainer: {
    height: 500,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    width: "95%",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 5,
    backgroundColor: "#FFFFFF",
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    color: "#4CAF50",
    fontSize: 36,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    marginBottom: 10,
  },
  button: {
    marginTop: 5,
    marginBottom: 10,
    alignContent: "center",
    height: 50,
    justifyContent: "center",
  },
  addButton: {
    marginTop: 5,
    marginBottom: 10,
    width: 100,
    alignSelf: "flex-end",
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    width: 100,
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#B50E2C",
  },
  registerLink: {
    textAlign: "center",
    color: "#4CAF50",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  textCenter: {
    textAlign: "center",
  },
  TermsButtonContainer: {
    paddingTop: 50,
  },

  stageContainer: {

    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },

  Weathercard: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#F9F9F9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: "100%",
  },
});

export default globalStyles;