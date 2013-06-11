package org.o2e.cometd.service;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.annotation.ServerAnnotationProcessor;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.DestructionAwareBeanPostProcessor;
import org.springframework.stereotype.Component;
import org.springframework.web.context.ServletContextAware;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.servlet.ServletContext;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/12/11
 * Time: 7:41 AM
 * To change this template use File | Settings | File Templates.
 */
@Component
public class SpringAnnotationConfigurator implements DestructionAwareBeanPostProcessor, ServletContextAware {

    @Inject
    private BayeuxServer bayeuxServer;

    private ServerAnnotationProcessor processor;

    @PostConstruct
    private void init()
    {
        this.processor = new ServerAnnotationProcessor(bayeuxServer);
    }

    public Object postProcessBeforeInitialization(Object bean, String name) throws BeansException
    {
        processor.processDependencies(bean);
        processor.processConfigurations(bean);
        processor.processCallbacks(bean);
        return bean;
    }

    public Object postProcessAfterInitialization(Object bean, String name) throws BeansException
    {
        return bean;
    }

    public void postProcessBeforeDestruction(Object bean, String name) throws BeansException
    {
        processor.deprocessCallbacks(bean);
    }

//    @Bean(initMethod = "start", destroyMethod = "stop")
//    public BayeuxServer bayeuxServer()
//    {
//        BayeuxServerImpl bean = new BayeuxServerImpl();
//        bean.setOption(BayeuxServerImpl.LOG_LEVEL, "3");
//        return bean;
//    }

    public void setServletContext(ServletContext servletContext)
    {
        servletContext.setAttribute(BayeuxServer.ATTRIBUTE, bayeuxServer);
    }
    
}
