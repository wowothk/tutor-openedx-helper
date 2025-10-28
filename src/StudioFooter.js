import { Container, Row, Col } from '@openedx/paragon';

export const StudioFooter = ({ 
  email = "support@studio.com", 
  phone = "1-800-STUDIO",
  logoSrc = "/Lambang_Polri.png",
  logoAlt = "Studio Logo",
  description = "Rastra Sewakottama - Abdi Utama bagi Nusa Bangsa"
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="studio-footer">
      <Container style={{fontSize: '14px'}}>
        <hr style={{ borderTop: '1px solid #ccc', margin: '0' }} />
        <Row className="justify-content-between py-4">
          <Col md={4} className="text-left px-4">
            <div className="mb-3">
              <img 
                src={logoSrc}
                alt={logoAlt}
                style={{ height: '52px', marginBottom: '16px' }}
              />
            </div>
            <p className="mb-3">
              {description}
            </p>
          </Col>
          
          <Col md={4} className="text-right">
            <h5 className="mb-3">Contact</h5>
            <p className="mb-1">{email}</p>
            <p className="mb-3">{phone}</p>
          </Col>
        </Row>
        <hr style={{ borderTop: '1px solid #ccc', margin: '0' }} />
        <Row>
          <Col className="text-center border-top">
            <p className="text-muted mb-0 py-4" style={{ fontSize: '12px' }}>
              &copy; {currentYear} Studio. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}