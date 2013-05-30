package org.o2e.util;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedOperationParameter;
import org.springframework.jmx.export.annotation.ManagedOperationParameters;
import org.springframework.jmx.export.annotation.ManagedResource;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 12/30/11
 * Time: 9:08 AM
 * To change this template use File | Settings | File Templates.
 */
@Component
@ManagedResource
public class Log4jConfigService {

    protected Map<String, Level> originalLevels = new HashMap<String, Level>();

    final org.slf4j.Logger log = LoggerFactory.getLogger(this.getClass());

    @ManagedOperation(description="Set a new log level for a class or package")
    @ManagedOperationParameters({
        @ManagedOperationParameter(name = "clazz", description = "Fully qualified class name"),
        @ManagedOperationParameter(name = "level", description = "New log level (error, warn, info, debug, trace")})
    public void setLogLevel(String clazz, String level) {
        // Look up current log level for this class or its parent
        Logger log = Logger.getLogger(clazz);
        Level currentLevel = log.getLevel() != null ? log.getLevel() : log.getParent().getLevel();

        // Add original log level to the Level map if it doesn't already exist
        Level originalLevel = originalLevels.get(clazz);
        if (originalLevel == null && currentLevel != null) {
            this.log.info("Saving entry to originalLevels map: '" + clazz + "' -> '" + currentLevel + "'");
            originalLevels.put(clazz, currentLevel);
        }

        // Set new log level
        log.setLevel(Level.toLevel(level));
        this.log.info("Set new log level for class/package '" + clazz + "' to '" + level + "'");
    }

    @ManagedOperation(description="Revert to original log level for a class or package")
    @ManagedOperationParameters({
        @ManagedOperationParameter(name = "clazz", description = "Fully qualified class name")})
    public void revertLogLevel(String clazz) {
        Logger log = Logger.getLogger(clazz);
        Level currentLevel = log.getLevel() != null ? log.getLevel() : log.getParent().getLevel();
        Level originalLevel = originalLevels.get(clazz);
        if (originalLevel != null) {
            log.setLevel(originalLevel);
            this.log.info("Reverted log level for class/package '" + clazz + "' from '" + currentLevel + "' to '" +
                    originalLevel + "'");
        }
        else this.log.info("Nothing found in originalLevels map for key '" + clazz + "'");
    }

}
