package com.rubiks.solver.service.validation;

import org.springframework.stereotype.Component;

import com.rubiks.solver.algorithm.Tools;

@Component
public class CubeValidator {

    /**
     * Validate a 54-character Kociemba cube string.
     *
     * Returns null if the string is valid and ready to solve.
     * Returns a human-readable error message if it is not.
     *
     * Tools.verify() return codes:
     *   0  = valid
     *  -1  = not exactly 9 of each face color
     *  -2  = one or more edge pieces do not exist on a real cube
     *  -3  = edge flip error (one edge is flipped -- physically impossible)
     *  -4  = one or more corner pieces do not exist on a real cube
     *  -5  = corner twist error (one corner is twisted -- physically impossible)
     *  -6  = parity error (requires an impossible two-piece swap)
     */
    public String validate(String cubeString) {
        if (cubeString == null || cubeString.length() != 54) {
            int len = cubeString == null ? 0 : cubeString.length();
            return "Cube string must be exactly 54 characters but got " + len + ". "
                 + "Make sure all 6 faces have been scanned.";
        }

        for (char c : cubeString.toCharArray()) {
            if (c != 'U' && c != 'R' && c != 'F' && c != 'D' && c != 'L' && c != 'B') {
                return "Cube string contains an invalid character '" + c + "'. "
                     + "Only U, R, F, D, L, B are allowed.";
            }
        }

        int result = Tools.verify(cubeString);
        return switch (result) {
            case  0 -> null; // valid
            case -1 -> "Color count error: each face color must appear exactly 9 times. "
                     + "At least one sticker was mis-identified. "
                     + "Use the 2D map to correct any wrong colors before solving.";
            case -2 -> "Edge piece error: one or more edge cubies do not exist on a real cube. "
                     + "Check the stickers on the edge (middle-row) positions.";
            case -3 -> "Edge flip error: one edge sticker is flipped -- this configuration is "
                     + "physically impossible. Check the edge stickers around the cube.";
            case -4 -> "Corner piece error: one or more corner cubies are unrecognised. "
                     + "Check the stickers at the corners of the cube.";
            case -5 -> "Corner twist error: one corner piece appears twisted -- this is physically "
                     + "impossible on an unmodified cube. Check the corner stickers.";
            case -6 -> "Parity error: the cube requires an impossible swap of two pieces. "
                     + "This is usually caused by a single mis-scanned sticker. "
                     + "Use the 2D map to correct any colours that look wrong.";
            default -> "Cube verification failed (code " + result + "). Check all scanned faces.";
        };
    }
}
