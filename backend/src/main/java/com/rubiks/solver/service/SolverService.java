package com.rubiks.solver.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.rubiks.solver.algorithm.Search;
import com.rubiks.solver.model.CubeStateRequest;
import com.rubiks.solver.model.SolutionResponse;
import com.rubiks.solver.service.validation.CubeValidator;

@Service
public class SolverService {

    private final CubeValidator validator;

    public SolverService(CubeValidator validator) {
        this.validator = validator;
        if (!Search.isInited()) {
            Search.init();
        }
    }

    public SolutionResponse solveCube(CubeStateRequest request) {
        String cubeString = request.getCubeString();

        String validationError = validator.validate(cubeString);
        if (validationError != null) {
            return new SolutionResponse(validationError);
        }

        // Call Kociemba's min2phase algorithm.
        // maxDepth: 21
        // probeMax: 100000000 (enough for finding wait solutions within a few ms/sec)
        // probeMin: 0
        // verbose: 0 (just standard format)
        Search search = new Search();
        String result = search.solution(cubeString, 21, 100000000, 0, 0);

        if (result.startsWith("Error")) {
            return new SolutionResponse("Solver Error: " + result);
        }

        List<String> mockSteps = Arrays.asList(result.trim().split("\\s+"));
        
        return new SolutionResponse(mockSteps, mockSteps.size());
    }
}
