import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function GameScreen() {
  return (
    <View style={styles.screen}>
      {/* Info row (three columns) */}
      <View style={styles.infoRow}>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>HOME</Text>
          <Text style={styles.infoValue}>1</Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>IDK</Text>
          <Text style={styles.infoValue}>4</Text>
        </View>
        <View style={styles.infoCell}>
          <Text style={styles.infoTitle}>AWAY</Text>
          <Text style={styles.infoValue}>0</Text>
        </View>
      </View>

      {/* Thin row for Balls / Strikes / Outs (dots) */}
      <View style={styles.countRow}>
        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>B</Text>
          <View style={styles.dotsRow}>
            <View style={styles.dotFilled} />
            <View style={styles.dotFilled} />
            <View style={styles.dotEmpty} />
          </View>
        </View>

        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>S</Text>
          <View style={styles.dotsRow}>
            <View style={styles.dotFilled} />
            <View style={styles.dotEmpty} />
            <View style={styles.dotEmpty} />
          </View>
        </View>

        <View style={styles.countGroup}>
          <Text style={styles.countLabel}>O</Text>
          <View style={styles.dotsRow}>
            <View style={styles.dotFilled} />
            <View style={styles.dotEmpty} />
            <View style={styles.dotEmpty} />
          </View>
        </View>
      </View>

      {/* Baseball field image in the center */}
      <View style={styles.fieldContainer}>
        <Image
          source={require("../assets/images/BaseballField_E.png")}
          style={styles.fieldImage}
          resizeMode="contain"
        />
      </View>

      {/* 2x2 grid of action buttons */}
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={styles.gridButton}
          onPress={() => console.log("Strike pressed")}
        >
          <Text style={styles.gridButtonText}>Strike</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={() => console.log("Ball pressed")}
        >
          <Text style={styles.gridButtonText}>Ball</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={() => console.log("Outcome pressed")}
        >
          <Text style={styles.gridButtonText}>Outcome</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridButton}
          onPress={() => console.log("Undo pressed")}
        >
          <Text style={styles.gridButtonText}>Undo</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom play bar with current play and up-arrow button */}
      <TouchableOpacity
        style={styles.playBar}
        onPress={() => console.log("Show players slide-up (to implement)")}
      >
        <Text style={styles.playText}>6. Chad Waters, #69</Text>
        <Text style={styles.upArrow}>^</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071524", // dark navy background
    paddingBottom: 64,
  },
  infoRow: {
    flexDirection: "row",
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoCell: {
    flex: 1,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 14,
    color: "#9CA3AF", // muted gray for titles
  },
  infoValue: {
    fontSize: 26,
    fontWeight: "600",
    color: "#34D399", // green accent for values
    marginTop: 4,
  },
  countRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  countGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  countLabel: {
    width: 18,
    textAlign: "center",
    color: "#Cbd5e1",
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    marginLeft: 8,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#34D399", // green accent
    marginRight: 6,
  },
  dotEmpty: {
    width: 10,
    height: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#34D399",
    backgroundColor: "transparent",
    marginRight: 6,
  },
  fieldContainer: {
    // increase flex so the field image occupies more vertical space
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  fieldImage: {
    // grow based on available width and height but keep a reasonable max
    width: Math.min(width * 0.98, 780),
    height: Math.min(height * 0.48, 720),
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: -12,
  },
  gridButton: {
    width: "48%",
    backgroundColor: "#0f1720", // slightly lighter than screen
    paddingVertical: 16,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    // Raised look
    shadowColor: "rgba(0,0,0,0.9)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  gridButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  playBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#0f1720",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#071524",
  },
  playText: {
    fontSize: 16,
    color: "#E6EEF7",
  },
  upArrow: {
    fontSize: 20,
    color: "#34D399",
    paddingHorizontal: 8,
  },
});
