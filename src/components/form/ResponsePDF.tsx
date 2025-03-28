'use client'

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

// Register fonts for PDF
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Open Sans'
  },
  header: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f6f6f6',
    borderRadius: 5
  },
  logo: {
    width: 100,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
    color: '#555555'
  },
  metaItem: {
    fontSize: 10,
    marginBottom: 3,
    color: '#777777'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
    padding: 5,
    backgroundColor: '#f0f0f0',
    color: '#444444'
  },
  fieldContainer: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingLeft: 5
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333333'
  },
  fieldValue: {
    fontSize: 11,
    color: '#555555',
    marginLeft: 10
  },
  emptyValue: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
    marginLeft: 10
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#999999',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10
  }
});

interface ResponsePDFProps {
  response: any;
  form: any;
}

const ResponsePDF: React.FC<ResponsePDFProps> = ({ response, form }) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    return format(new Date(timestamp.toDate ? timestamp.toDate() : timestamp), 'PPpp');
  };
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with form info */}
        <View style={styles.header}>
          {form?.settings?.logo && (
            <Image src={form.settings.logo} style={styles.logo} />
          )}
          <Text style={styles.title}>{form?.name || 'Form Response'}</Text>
          <Text style={styles.subtitle}>Response ID: {response?.id}</Text>
          <Text style={styles.metaItem}>Submitted: {formatDate(response?.createdAt)}</Text>
          <Text style={styles.metaItem}>
            Submitted by: {response?.submitterName || 'Anonymous'} 
            {response?.submitterEmail ? ` (${response?.submitterEmail})` : ''}
          </Text>
          {response?.ipAddress && (
            <Text style={styles.metaItem}>IP Address: {response.ipAddress}</Text>
          )}
        </View>
        
        {/* Response data */}
        <Text style={styles.sectionTitle}>Response Details</Text>
        
        {form?.fields?.map((field: any) => {
          const value = response?.data?.[field.id];
          
          return (
            <View key={field.id} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              {value ? (
                <Text style={styles.fieldValue}>{value}</Text>
              ) : (
                <Text style={styles.emptyValue}>No response</Text>
              )}
            </View>
          );
        })}
        
        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated on {format(new Date(), 'PPpp')}</Text>
          <Text>Form created with FormBuilder</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ResponsePDF; 