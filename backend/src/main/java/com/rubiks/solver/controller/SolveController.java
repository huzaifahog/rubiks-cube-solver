package com.rubiks.solver.controller;

import com.rubiks.solver.model.CubeStateRequest;
import com.rubiks.solver.model.SolutionResponse;
import com.rubiks.solver.service.SolverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // Allow React frontend to connect
public class SolveController {

    private final SolverService solverService;

    public SolveController(SolverService solverService) {
        this.solverService = solverService;
    }

    @PostMapping("/solve")
    public ResponseEntity<SolutionResponse> solve(@RequestBody CubeStateRequest request) {
        SolutionResponse response = solverService.solveCube(request);
        
        if (response.getError() != null) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }
}
