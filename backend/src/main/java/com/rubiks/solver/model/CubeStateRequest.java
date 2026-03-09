package com.rubiks.solver.model;

public class CubeStateRequest {
    private String cubeString;

    public CubeStateRequest() {}

    public CubeStateRequest(String cubeString) {
        this.cubeString = cubeString;
    }

    public String getCubeString() {
        return cubeString;
    }

    public void setCubeString(String cubeString) {
        this.cubeString = cubeString;
    }
}
