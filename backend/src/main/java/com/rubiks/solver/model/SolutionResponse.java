package com.rubiks.solver.model;

import java.util.List;

public class SolutionResponse {
    private List<String> moves;
    private int moveCount;
    private String error;

    public SolutionResponse() {}

    public SolutionResponse(List<String> moves, int moveCount) {
        this.moves = moves;
        this.moveCount = moveCount;
    }

    public SolutionResponse(String error) {
        this.error = error;
    }

    public List<String> getMoves() {
        return moves;
    }

    public void setMoves(List<String> moves) {
        this.moves = moves;
    }

    public int getMoveCount() {
        return moveCount;
    }

    public void setMoveCount(int moveCount) {
        this.moveCount = moveCount;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
